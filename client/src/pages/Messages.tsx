import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { useSocket } from "@/hooks/useSocket";
import { 
  Sparkles,
  Send,
  MessageCircle,
  ArrowLeft
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

export default function Messages() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { socket, isConnected } = useSocket();
  const utils = trpc.useUtils();

  const { data: conversations, isLoading: loadingConversations } = trpc.messaging.conversations.useQuery();
  const { data: messages, isLoading: loadingMessages } = trpc.messaging.getMessages.useQuery(
    { conversationId: selectedConversation! },
    { enabled: !!selectedConversation }
  );

  const sendMessageMutation = trpc.messaging.sendMessage.useMutation({
    onSuccess: (newMessage) => {
      setMessageInput("");
      utils.messaging.getMessages.invalidate({ conversationId: selectedConversation! });
      utils.messaging.conversations.invalidate();

      // Broadcast via Socket.io
      if (socket) {
        socket.emit("message:send", {
          conversationId: selectedConversation,
          message: newMessage,
        });
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Socket.io event listeners
  useEffect(() => {
    if (!socket || !selectedConversation) return;

    // Join conversation room
    socket.emit("join:conversation", selectedConversation);

    // Listen for new messages
    const handleNewMessage = (message: any) => {
      utils.messaging.getMessages.invalidate({ conversationId: selectedConversation });
      utils.messaging.conversations.invalidate();
    };

    // Listen for typing indicators
    const handleUserTyping = (data: { userId: number; userName: string }) => {
      setTypingUsers(prev => new Set(prev).add(data.userId));
    };

    const handleUserStoppedTyping = (data: { userId: number }) => {
      setTypingUsers(prev => {
        const next = new Set(prev);
        next.delete(data.userId);
        return next;
      });
    };

    socket.on("message:new", handleNewMessage);
    socket.on("user:typing", handleUserTyping);
    socket.on("user:stopped-typing", handleUserStoppedTyping);

    return () => {
      socket.emit("leave:conversation", selectedConversation);
      socket.off("message:new", handleNewMessage);
      socket.off("user:typing", handleUserTyping);
      socket.off("user:stopped-typing", handleUserStoppedTyping);
    };
  }, [socket, selectedConversation, utils]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;

    const conv = conversations?.find(c => c.conversationId === selectedConversation);
    if (!conv) return;

    sendMessageMutation.mutate({
      propertyId: conv.propertyId,
      receiverId: conv.otherUserId,
      content: messageInput.trim(),
    });

    // Stop typing indicator
    if (socket) {
      socket.emit("typing:stop", selectedConversation);
    }
  };

  const handleTyping = () => {
    if (!socket || !selectedConversation) return;

    // Emit typing start
    socket.emit("typing:start", selectedConversation);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing:stop", selectedConversation);
    }, 2000);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <p className="mb-4">Effettua il login per accedere ai messaggi</p>
          <Link href="/">
            <Button>Torna alla Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="glass-effect border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <Sparkles className="w-8 h-8 text-primary" />
                <span className="text-2xl font-serif font-bold text-gradient-gold">
                  Luxury Booking
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <Link href="/properties">
                <Button variant="ghost">Ville</Button>
              </Link>
              <Link href="/messages">
                <Button variant="default">Messaggi</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Chat Interface */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List - Left Side */}
        <div className="w-1/3 border-r bg-background overflow-y-auto">
          <div className="p-4 border-b">
            <h2 className="text-2xl font-serif font-bold">Messaggi</h2>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              {isConnected ? 'Connesso' : 'Disconnesso'}
            </div>
          </div>

          {loadingConversations ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-muted rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded mb-2" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : conversations && conversations.length > 0 ? (
            <div className="divide-y">
              {conversations.map((conv) => (
                <div
                  key={conv.conversationId}
                  className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedConversation === conv.conversationId ? 'bg-muted' : ''
                  }`}
                  onClick={() => setSelectedConversation(conv.conversationId)}
                >
                  <div className="flex gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(`User ${conv.otherUserId}`)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold truncate">
                          User {conv.otherUserId}
                        </h3>
                        {conv.unreadCount > 0 && (
                          <Badge variant="default" className="ml-2">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(conv.lastMessageAt), { 
                          addSuffix: true,
                          locale: it 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-serif font-semibold mb-2">
                Nessun messaggio
              </h3>
              <p className="text-sm text-muted-foreground">
                Inizia una conversazione con un proprietario
              </p>
            </div>
          )}
        </div>

        {/* Messages - Right Side */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-6">
                {loadingMessages ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-muted rounded" />
                      </div>
                    ))}
                  </div>
                ) : messages && messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isOwn = msg.senderId === user.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              isOwn
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="break-words">{msg.content}</p>
                            <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                              {formatDistanceToNow(new Date(msg.createdAt), { 
                                addSuffix: true,
                                locale: it 
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {typingUsers.size > 0 && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg px-4 py-2">
                          <p className="text-sm text-muted-foreground italic">
                            Sta scrivendo...
                          </p>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Nessun messaggio in questa conversazione
                    </p>
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Scrivi un messaggio..."
                    value={messageInput}
                    onChange={(e) => {
                      setMessageInput(e.target.value);
                      handleTyping();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendMessageMutation.isPending}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-24 h-24 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-serif font-semibold mb-2">
                  Seleziona una conversazione
                </h3>
                <p className="text-muted-foreground">
                  Scegli una conversazione dalla lista per iniziare a chattare
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
