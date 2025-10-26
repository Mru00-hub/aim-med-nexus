import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PostOrThreadSummary, getThreadsForSpace, deleteThread, updateThreadDetails } from '@/integrations/supabase/community.api';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
// Note: You will need to create and import the EditThreadDialog if you want to break it down further
// For simplicity, I'm keeping the logic here.

interface ChatThreadListProps {
  spaceId: string;
  isUserAdminOrMod: boolean;
  refreshKey: number;
}

export const ChatThreadList: React.FC<ChatThreadListProps> = ({ spaceId, isUserAdminOrMod, refreshKey }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [threads, setThreads] = useState<PostOrThreadSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingThread, setEditingThread] = useState<PostOrThreadSummary | null>(null);
  const fetchThreads = useCallback(async () => {
    setIsLoading(true);
    try {
      // Chat spaces don't need pagination for their thread list
      const data = await getThreadsForSpace({ spaceId: spaceId, page: 1, limit: 100 }); 
      setThreads(data || []);
    } catch (error: any) {
      toast({ title: "Error fetching threads", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [spaceId, toast]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads, refreshKey]);

  const handleDeleteThread = async (threadId: string) => {
    try {
      await deleteThread(threadId);
      toast({ title: "Success", description: "Thread has been deleted." });
      fetchThreads(); // Refresh list
    } catch (error: any) {
      toast({ variant: "destructive", title: "Deletion Failed", description: error.message });
    }
  };

  const handleUpdateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingThread) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    
    if (!title.trim()) {
      toast({ title: "Title cannot be empty", variant: "destructive" });
      return;
    }
    
    try {
      await updateThreadDetails(editingThread.id, { title, description });
      toast({ title: "Success", description: "Thread updated." });
      fetchThreads(); // Refresh list
      setEditingThread(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <p>No threads have been started in this space yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {threads.map(thread => {
        const canManageThread = isUserAdminOrMod || user?.id === thread.creator_id;
        const creatorDetails = [thread.creator_position, thread.creator_specialization]
          .filter(Boolean)
          .join(' • ');
        
        return (
            <Card key={thread.id} className="transition-all hover:shadow-md group">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <Link to={`/community/thread/${thread.id}`} className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg group-hover:text-primary break-words">{thread.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 break-words">
                      {thread.total_message_count} messages • Started by{' '}
                      <span className="font-medium">{thread.creator_full_name}</span>
                      {creatorDetails && <span className="text-xs block sm:inline sm:ml-2 opacity-80">{creatorDetails}</span>}
                    </p>
                    {thread.last_message_body && (
                      <p className="text-sm text-muted-foreground mt-2 truncate">
                        <strong>Last:</strong> {thread.last_message_body}
                      </p>
                    )}
                  </Link>
                  {canManageThread && (
                    <div className="flex items-center gap-1 flex-shrink-0 sm:ml-4">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingThread(thread)}>
                        <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      </Button>
                      <AlertDialog> 
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this thread?</AlertDialogTitle>
                            <AlertDialogDescription>Permanently delete "{thread.title}"? This cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteThread(thread.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!editingThread} onOpenChange={(isOpen) => !isOpen && setEditingThread(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Thread</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateThread} className="pt-4 space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                name="title" 
                defaultValue={editingThread?.title} 
                required 
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editingThread?.description || ''}
                placeholder="A brief description of this thread..."
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditingThread(null)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
