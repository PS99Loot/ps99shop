import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Layout from '@/components/layout/Layout';
import StatusBadge from '@/components/store/StatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Search, Lock } from 'lucide-react';
import SupportCTA from '@/components/store/SupportCTA';

const ORDER_TIMELINE = [
  'awaiting_payment', 'payment_detected', 'confirming', 'paid',
  'queued_for_delivery', 'in_delivery', 'completed',
];

const TrackOrderPage = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [orderId, setOrderId] = useState(searchParams.get('order') || '');
  const [accessCode, setAccessCode] = useState('');
  const [searched, setSearched] = useState(false);

  const { data: order, refetch, isLoading } = useQuery({
    queryKey: ['track-order', orderId, accessCode],
    queryFn: async () => {
      if (!orderId) return null;
      const { data } = await supabase.rpc('lookup_order', { p_order_id: orderId, p_access_code: accessCode });
      if (data && data.length > 0) return data[0];
      return null;
    },
    enabled: false,
  });

  // Poll every 5 seconds when order is in a payment-pending state
  useEffect(() => {
    if (!order) return;
    const pendingStatuses = ['awaiting_payment', 'payment_detected', 'confirming'];
    if (!pendingStatuses.includes(order.status)) return;

    const interval = setInterval(() => refetch(), 5000);
    return () => clearInterval(interval);
  }, [order?.status, refetch]);

  const { data: orderItems } = useQuery({
    queryKey: ['track-order-items', order?.id],
    queryFn: async () => {
      if (!order?.id) return [];
      const { data } = await supabase.from('order_items').select('*').eq('order_id', order.id);
      return data || [];
    },
    enabled: !!order?.id,
  });

  const { data: events } = useQuery({
    queryKey: ['track-order-events', order?.id],
    queryFn: async () => {
      if (!order?.id) return [];
      const { data } = await supabase.from('order_events').select('*').eq('order_id', order.id).order('created_at', { ascending: true });
      return data || [];
    },
    enabled: !!order?.id,
  });

  const handleSearch = () => {
    setSearched(true);
    refetch();
  };

  const currentStep = order ? ORDER_TIMELINE.indexOf(order.status) : -1;
  const canPay = order && order.status === 'awaiting_payment' && order.oxapay_payment_url;

  const { data: myOrders } = useQuery({
    queryKey: ['my-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="font-display text-3xl font-bold mb-8 text-center">Track Your Order</h1>

        <div className="bg-card border border-border rounded-lg p-6 space-y-4 mb-8">
          <div>
            <Label>Order ID</Label>
            <Input value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="PS99-XXXXXX" className="bg-muted" />
          </div>
          <div>
            <Label>Access Code</Label>
            <Input value={accessCode} onChange={e => setAccessCode(e.target.value)} placeholder="Your access code" className="bg-muted" />
          </div>
          <Button onClick={handleSearch} className="w-full gradient-primary text-primary-foreground" disabled={isLoading}>
            <Search className="mr-2 h-4 w-4" /> {isLoading ? 'Searching...' : 'Track Order'}
          </Button>
        </div>

        {searched && !order && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Order not found. Check your order ID and access code.</p>
          </div>
        )}

        {order && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order</p>
                  <p className="font-display text-xl font-bold">{order.public_order_id}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              {/* Timeline */}
              <div className="flex items-center gap-1 my-6 overflow-x-auto pb-2">
                {ORDER_TIMELINE.map((s, i) => (
                  <div key={s} className="flex items-center gap-1 flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full ${i <= currentStep ? 'gradient-primary' : 'bg-muted'}`} />
                    {i < ORDER_TIMELINE.length - 1 && <div className={`w-6 md:w-10 h-0.5 ${i < currentStep ? 'gradient-primary' : 'bg-muted'}`} />}
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground capitalize">{order.status.replace(/_/g, ' ')}</div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Roblox</span><span>{order.buyer_roblox_username}</span></div>
                {order.buyer_discord_username && <div className="flex justify-between"><span className="text-muted-foreground">Discord</span><span>{order.buyer_discord_username}</span></div>}
                {order.selected_crypto && <div className="flex justify-between"><span className="text-muted-foreground">Crypto</span><span>{order.selected_crypto}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span>${Number(order.total_usd).toFixed(2)}</span></div>
                {order.queue_position && <div className="flex justify-between"><span className="text-muted-foreground">Queue Position</span><span>#{order.queue_position}</span></div>}
              </div>

              {/* Pay button if awaiting */}
              {canPay && (
                <Button
                  className="w-full mt-4 gradient-primary text-primary-foreground"
                  onClick={() => window.location.href = order.oxapay_payment_url!}
                >
                  <Lock className="mr-2 h-4 w-4" /> Complete Payment
                </Button>
              )}
            </div>

            {/* Items */}
            {orderItems && orderItems.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-semibold mb-3">Items</h3>
                {orderItems.map(item => (
                  <div key={item.id} className="flex justify-between text-sm py-1">
                    <span>{item.quantity}x {item.product_name_snapshot}</span>
                    <span>${Number(item.total_price_usd).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Events */}
            {events && events.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-semibold mb-3">Order History</h3>
                <div className="space-y-2">
                  {events.map(e => (
                    <div key={e.id} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <div>
                        <p>{e.event_message}</p>
                        <p className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <SupportCTA orderId={order.public_order_id} />
          </div>
        )}

        {user && myOrders && myOrders.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-xl font-bold mb-4">Your Orders</h2>
            <div className="space-y-3">
              {myOrders.map(o => (
                <div key={o.id} className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
                  <div>
                    <p className="font-semibold">{o.public_order_id}</p>
                    <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={o.status} />
                    <Link to={`/track?order=${o.public_order_id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TrackOrderPage;
