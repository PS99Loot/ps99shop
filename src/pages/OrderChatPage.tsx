import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import StatusBadge from '@/components/store/StatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

const OrderChatPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const accessCode = searchParams.get('code') || '';
  const { user, isAdmin } = useAuth();
  const [messages, setMessages] = useState<Tables<'chat_messages'>[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Lookup order
  const { data: order } = useQuery({
    queryKey: ['chat-order', orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const { data } = await supabase.rpc('lookup_order', { p_order_id: orderId, p_access_code: accessCode });
      if (data && data.length > 0) return data[0];
      // Try as admin
      if (isAdmin) {
        const { data: d2 } = await supabase.from('orders').select('*').eq('public_order_id', orderId).single();
        return d2;
      }
      return null;
    },
    enabled: !!orderId,
  });

  const { data: orderItems } = useQuery({
    queryKey: ['chat-order-items', order?.id],
    queryFn: async () => {
      if (!order?.id) return [];
      const { data } = await supabase.from('order_items').select('*').eq('order_id', order.id);
      return data || [];
    },
    enabled: !!order?.id,
  });

  // Load messages
  useEffect(() => {
    if (!order?.id) return;
    const loadMessages = async () => {
      const { data } = await supabase.from('chat_messages').select('*').eq('order_id', order.id).order('created_at', { ascending: true });
      setMessages(data || []);
    };
    loadMessages();

    // Realtime subscription
    const channel = supabase.channel(`chat-${order.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `order_id=eq.${order.id}` },
        (payload) => { setMessages(prev => [...prev, payload.new as Tables<'chat_messages'>]); }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [order?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !order?.id) return;
    setSending(true);
    try {
      await supabase.from('chat_messages').insert({
        order_id: order.id,
        sender_profile_id: user?.id || null,
        sender_type: isAdmin ? 'admin' : 'buyer',
        message: newMessage.trim(),
      });
      setNewMessage('');
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (!order) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">
          <p>Order not found or access denied.</p>
        </div>
      </Layout>
    );
  }

  const chatAllowed = ['paid', 'queued_for_delivery', 'in_delivery', 'completed'].includes(order.status) || isAdmin;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="grid md:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
          {/* Sidebar */}
          <div className="hidden md:block bg-card border border-border rounded-lg p-4 space-y-4 overflow-y-auto">
            <div>
              <p className="text-xs text-muted-foreground">Order</p>
              <p className="font-display font-bold">{order.public_order_id}</p>
            </div>
            <StatusBadge status={order.status} />
            <div className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Roblox:</span> <span className="font-medium">{order.buyer_roblox_username}</span></div>
              {order.buyer_discord_username && <div><span className="text-muted-foreground">Discord:</span> <span className="font-medium">{order.buyer_discord_username}</span></div>}
              <div><span className="text-muted-foreground">Total:</span> <span className="font-medium">${Number(order.total_usd).toFixed(2)}</span></div>
              <div><span className="text-muted-foreground">Crypto:</span> <span className="font-medium">{order.selected_crypto}</span></div>
            </div>
            {orderItems && orderItems.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Items</p>
                {orderItems.map(i => (
                  <div key={i.id} className="text-sm">{i.quantity}x {i.product_name_snapshot}</div>
                ))}
              </div>
            )}
          </div>

          {/* Chat */}
          <div className="md:col-span-3 bg-card border border-border rounded-lg flex flex-col">
            <div className="p-4 border-b border-border">
              <h2 className="font-display font-bold">Order Chat - {order.public_order_id}</h2>
              <p className="text-xs text-muted-foreground">Coordinate delivery with support</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  {chatAllowed ? 'No messages yet. Start the conversation!' : 'Chat will be available after payment is confirmed.'}
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender_type === 'buyer' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-lg p-3 ${
                    msg.sender_type === 'system' ? 'bg-muted text-muted-foreground text-center mx-auto text-xs italic' :
                    msg.sender_type === 'buyer' ? 'gradient-primary text-primary-foreground' :
                    'bg-muted text-foreground'
                  }`}>
                    {msg.sender_type !== 'system' && (
                      <p className="text-xs opacity-70 mb-1">{msg.sender_type === 'admin' ? '🛡️ Support' : 'You'}</p>
                    )}
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs opacity-50 mt-1">{new Date(msg.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            {chatAllowed && (
              <div className="p-4 border-t border-border flex gap-2">
                <Input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="bg-muted"
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <Button onClick={handleSend} disabled={sending || !newMessage.trim()} className="gradient-primary text-primary-foreground">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderChatPage;
