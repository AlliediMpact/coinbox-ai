'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { messagingService, Conversation, Message } from '@/lib/messaging-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  MessageCircle,
  Send,
  Search,
  MoreVertical,
  Archive,
  Trash2,
  User,
  Clock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to conversations
  useEffect(() => {
    if (!user) return;

    const unsubscribe = messagingService.subscribeToConversations(
      user.uid,
      (convs) => {
        setConversations(convs);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Subscribe to messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation) return;

    const unsubscribe = messagingService.subscribeToMessages(
      selectedConversation,
      (msgs) => {
        setMessages(msgs);
        scrollToBottom();
      }
    );

    // Mark messages as read
    if (user) {
      messagingService.markMessagesAsRead(selectedConversation, user.uid);
    }

    return () => unsubscribe();
  }, [selectedConversation, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !user) return;

    const conversation = conversations.find(c => c.id === selectedConversation);
    if (!conversation) return;

    const recipientId = conversation.participants.find(p => p !== user.uid)!;
    const senderName = conversation.participantNames[user.uid] || user.email || 'You';

    try {
      await messagingService.sendMessage(
        selectedConversation,
        user.uid,
        senderName,
        recipientId,
        messageInput.trim()
      );
      setMessageInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleArchiveConversation = async (conversationId: string) => {
    if (!user) return;
    try {
      await messagingService.archiveConversation(conversationId, user.uid);
    } catch (error) {
      console.error('Failed to archive conversation:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await messagingService.deleteMessage(messageId);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    const otherUserId = conv.participants.find(p => p !== user?.uid);
    const otherUserName = otherUserId ? conv.participantNames[otherUserId] : '';
    return otherUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           conv.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const selectedConv = conversations.find(c => c.id === selectedConversation);
  const otherUserId = selectedConv?.participants.find(p => p !== user?.uid);
  const otherUserName = otherUserId && selectedConv ? selectedConv.participantNames[otherUserId] : '';

  if (!user) {
    return <div className="p-6">Please log in to view messages.</div>;
  }

  return (
    <ProtectedRoute>
      <div className="h-[calc(100vh-120px)] flex gap-4 p-6">
      {/* Conversations List */}
      <Card className="w-80 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Messages
          </CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">Loading...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchTerm ? 'No conversations found' : 'No messages yet'}
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredConversations.map((conv) => {
                  const otherId = conv.participants.find(p => p !== user.uid);
                  const otherName = otherId ? conv.participantNames[otherId] : 'Unknown';
                  const unread = conv.unreadCount[user.uid] || 0;
                  const isSelected = selectedConversation === conv.id;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/10' : 'hover:bg-muted'
                      }`}
                    >
                      <Avatar>
                        <AvatarFallback>
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="font-medium text-sm truncate">{otherName}</p>
                          {conv.lastMessageTime && (
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(conv.lastMessageTime.toDate(), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.lastMessage || 'No messages yet'}
                        </p>
                      </div>
                      {unread > 0 && (
                        <Badge variant="destructive" className="ml-auto">
                          {unread}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        {selectedConversation && selectedConv ? (
          <>
            {/* Chat Header */}
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{otherUserName}</h3>
                    {selectedConv.tradeTicketId && (
                      <p className="text-xs text-muted-foreground">
                        Trade: {selectedConv.tradeTicketId}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleArchiveConversation(selectedConversation)}>
                      <Archive className="w-4 h-4 mr-2" />
                      Archive Conversation
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => {
                  const isSender = message.senderId === user.uid;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${isSender ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`rounded-lg p-3 ${
                            isSender
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                          {message.edited && (
                            <span className="text-xs opacity-70">(edited)</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 px-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {message.timestamp && formatDistanceToNow(message.timestamp.toDate(), { addSuffix: true })}
                          </span>
                          {isSender && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 ml-auto"
                              onClick={() => handleDeleteMessage(message.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={!messageInput.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </Card>
    </div>
    </ProtectedRoute>
  );
}
