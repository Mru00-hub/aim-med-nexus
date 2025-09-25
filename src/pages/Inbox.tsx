import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Send, 
  Paperclip,
  Smile,
  Search,
  MoreVertical,
  Phone,
  Video,
  Star,
  Archive,
  Trash2
} from 'lucide-react';

/**
 * Inbox Page - Personal messaging system
 * WhatsApp-style interface for professional healthcare communication
 */
const Inbox = () => {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(1);
  const [newMessage, setNewMessage] = useState('');

  // Example conversations - in real app this would come from API
  const conversations = [
    {
      id: 1,
      name: 'Dr. Aisha Khan',
      title: 'Cardiologist',
      lastMessage: 'Thanks for sharing the ECG interpretation guidelines!',
      timestamp: '2 min ago',
      unreadCount: 2,
      isOnline: true,
      profileImage: '/api/placeholder/48/48'
    },
    {
      id: 2,
      name: 'Dr. Rajesh Kumar',
      title: 'Emergency Medicine',
      lastMessage: 'Could you review this trauma case when you have time?',
      timestamp: '1 hour ago',
      unreadCount: 0,
      isOnline: false,
      profileImage: '/api/placeholder/48/48'
    },
    {
      id: 3,
      name: 'Sarah Johnson',
      title: 'Healthcare Analyst',
      lastMessage: 'The data analysis report is ready for your review.',
      timestamp: '3 hours ago',
      unreadCount: 1,
      isOnline: true,
      profileImage: '/api/placeholder/48/48'
    },
    {
      id: 4,
      name: 'Dr. Priya Sharma',
      title: 'Pediatrician',
      lastMessage: 'Great discussion in the pediatrics forum today!',
      timestamp: '1 day ago',
      unreadCount: 0,
      isOnline: false,
      profileImage: '/api/placeholder/48/48'
    }
  ];

  // Example messages for selected conversation
  const messages = [
    {
      id: 1,
      senderId: 1,
      senderName: 'Dr. Aisha Khan',
      content: 'Hi! I saw your post about the new cardiac guidelines. Very insightful!',
      timestamp: '10:30 AM',
      isMe: false
    },
    {
      id: 2,
      senderId: 'me',
      senderName: 'You',
      content: 'Thank you! I\'ve been working on implementing them in our practice.',
      timestamp: '10:32 AM',
      isMe: true
    },
    {
      id: 3,
      senderId: 1,
      senderName: 'Dr. Aisha Khan',
      content: 'That\'s great! How has the patient response been? I\'m considering similar changes.',
      timestamp: '10:35 AM',
      isMe: false
    },
    {
      id: 4,
      senderId: 'me',
      senderName: 'You',
      content: 'Overall positive. The new protocols have reduced wait times and improved accuracy. I can share our implementation strategy if you\'re interested.',
      timestamp: '10:38 AM',
      isMe: true
    },
    {
      id: 5,
      senderId: 1,
      senderName: 'Dr. Aisha Khan',
      content: 'That would be incredibly helpful! Thank you so much.',
      timestamp: '10:40 AM',
      isMe: false
    },
    {
      id: 6,
      senderId: 1,
      senderName: 'Dr. Aisha Khan',
      content: 'Thanks for sharing the ECG interpretation guidelines!',
      timestamp: '2 min ago',
      isMe: false
    }
  ];

  const selectedContact = conversations.find(c => c.id === selectedConversation);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      // In real app, this would send the message via API
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-medical py-8">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Inbox</h1>
          <p className="text-muted-foreground text-lg">
            Private messages and professional communication with your network.
          </p>
        </div>

        {/* Messages Interface */}
        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6 min-h-[700px] animate-slide-up">
          {/* Conversations List */}
          <Card className="card-medical lg:col-span-1 flex flex-col max-h-[700px]">
            <CardHeader className="pb-4 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="text-lg">Messages</CardTitle>
                <Badge variant="secondary">{conversations.filter(c => c.unreadCount > 0).length} unread</Badge>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search conversations..." className="pl-10" />
              </div>
            </CardHeader>
            
            <CardContent className="p-0 overflow-y-auto flex-1">
              <div className="space-y-1">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors border-l-2 ${
                      selectedConversation === conversation.id 
                        ? 'bg-primary/5 border-l-primary' 
                        : 'border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-xs">
                            {conversation.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        {conversation.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-card"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-medium text-sm truncate pr-2">{conversation.name}</h4>
                          <span className="text-xs text-muted-foreground flex-shrink-0">{conversation.timestamp}</span>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-1 truncate">{conversation.title}</p>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground truncate pr-2 flex-1">
                            {conversation.lastMessage}
                          </p>
                          
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs flex-shrink-0">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="card-medical lg:col-span-3 flex flex-col">
            {selectedContact ? (
              <>
                {/* Chat Header */}
                <CardHeader className="pb-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {selectedContact.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        {selectedContact.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-card"></div>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="font-semibold">{selectedContact.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedContact.isOnline ? 'Online' : `${selectedContact.title} • Last seen 2h ago`}
                        </p>
                      </div>
                    </div>
                    
                     <div className="flex items-center gap-2">
                       <Button variant="ghost" size="sm">
                         <Star className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="sm">
                         <MoreVertical className="h-4 w-4" />
                       </Button>
                     </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.isMe
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.isMe ? 'text-primary-foreground/70' : 'text-muted-foreground/70'
                        }`}>
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>

                {/* Message Input */}
                <div className="p-4 border-t border-border">
                  <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                    <div className="flex-1">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="min-h-[40px] max-h-32 resize-none"
                        onKeyDown={(e) => {
                          // Allow Enter for new line, only send with button click
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="ghost" size="sm">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm">
                        <Smile className="h-4 w-4" />
                      </Button>
                      <Button type="submit" size="sm" className="btn-medical" disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    Press Enter for new line, use Send button to send message
                  </p>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">
                    Choose a conversation from the list to start messaging.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 animate-fade-in">
          <Card className="card-medical">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button variant="outline" size="sm">
                  <Archive className="h-4 w-4 mr-2" />
                  Archive All Read
                </Button>
                <Button variant="outline" size="sm">
                  Mark All as Read
                </Button>
                <Button variant="outline" size="sm">
                  <Star className="h-4 w-4 mr-2" />
                  Starred Messages
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Conversations
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Inbox;