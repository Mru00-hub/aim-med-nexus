import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { socialApi } from '@/integrations/supabase/social.api';
import type { Tables } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';

type MessageWithRelations = Tables<'direct_messages'> & {
  direct_message_reactions: Tables<'direct_message_reactions'>[];
  direct_message_attachments: Tables<'direct_message_attachments'>[];
};

export const useConversationData = (conversationId: string | undefined) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<MessageWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    const { data } = await socialApi.messaging.getMessagesForConversation(conversationId);
    if (data) setMessages(data as MessageWithRelations[]);
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages', filter: `conversation_id=eq.${conversationId}` }, fetchMessages)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_message_reactions' }, fetchMessages)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_message_attachments' }, fetchMessages)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, fetchMessages]);

  const sendMessage = useCallback(async (body: string, files: File[]) => {
    if (!conversationId || !user || !profile) return;

    const tempMsgId = -Date.now();
    const optimisticAttachments = files.map((file, i) => ({
      id: `temp-att-${i}`,
      message_id: tempMsgId,
      file_name: file.name,
      file_type: file.type,
      file_url: URL.createObjectURL(file),
      uploaded_by: user.id,
      isUploading: true,
    }));

    const optimisticMessage: MessageWithRelations = {
      id: tempMsgId,
      conversation_id: conversationId,
      sender_id: user.id,
      content: body,
      created_at: new Date().toISOString(),
      updated_at: null,
      is_edited: false,
      is_read: false,
      direct_message_reactions: [],
      direct_message_attachments: optimisticAttachments as any,
    };

    setMessages(current => [...current, optimisticMessage]);

    try {
      const { data: realMessage } = await socialApi.messaging.sendMessage({ conversation_id: conversationId, sender_id: user.id, content: body, parent_message_id: parentId });
      if (!realMessage || !realMessage.id) {
          throw new Error("Message creation failed on the server.");
      }
      setMessages(current => current.map(msg => msg.id === tempMsgId ? { ...msg, id: realMessage.id } : msg));

      if (files.length > 0) {
        await Promise.all(files.map(async (file, index) => {
          try {
            const { data: uploadData } = await socialApi.messaging.uploadAttachment(file, conversationId);
            if (!uploadData?.publicUrl) throw new Error("Upload failed.");

            const { data: realAttachment } = await socialApi.messaging.addAttachmentToMessage({
              message_id: realMessage.id,
              file_url: uploadData.publicUrl,
              file_name: file.name,
              file_type: file.type,
              file_size_bytes: file.size,
              uploaded_by: user.id,
            });

            if (!realAttachment) throw new Error("Attachment record creation failed.");
            
            setMessages(current => current.map(msg => msg.id === realMessage.id ? { ...msg, direct_message_attachments: msg.direct_message_attachments.map(att => att.id === optimisticAttachments[index].id ? { ...realAttachment, isUploading: false } : att) } : msg));
          } catch (uploadError) {
             setMessages(current => current.map(msg => msg.id === realMessage.id ? { ...msg, direct_message_attachments: msg.direct_message_attachments.map(att => att.id === optimisticAttachments[index].id ? { ...att, isUploading: false, file_url: 'upload-failed' } : att) } : msg));
          }
        }));
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to Send', description: error.message });
      setMessages(current => current.filter(m => m.id !== tempMsgId));
    }
  }, [conversationId, user, profile, toast]);

  // Return the state and handlers for the view component to use
  return { messages, loading, sendMessage };
};
