import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Copy, Clock, CheckCircle } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { createPaymentRequest } from '@/services/paymentService';
import { toast } from 'sonner';

const PAYMENT_STATUSES = ['awaiting_payment', 'payment_detected', 'confirming', 'paid'] as const;

const CheckoutPage = () => {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [robloxUsername, setRobloxUsername] = useState('');
  const [discordUsername, setDiscordUsername] = useState('');
  const [email, setEmail] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState('');
  const [orderCreated, setOrderCreated] = useState<{ orderId: string; accessCode: string; payment: ReturnType<typeof createPaymentRequest> } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('awaiting_payment');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800);

  const { data: cryptos } = useQuery({
    queryKey: ['crypto-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('crypto_settings').select('*').eq('enabled', true);
      return data || [];
    },
  });

  const handleCreateOrder = async () => {
    if (!robloxUsername.trim()) { toast.error('Roblox username is required'); return; }
    if (!selectedCrypto) { toast.error('Please select a cryptocurrency'); return; }
    if (items.length === 0) { toast.error('Cart is empty'); return; }

    setLoading(true);
    try {
      const payment = createPaymentRequest(subtotal, selectedCrypto);

      const { data: order, error: orderError } = await supabase.from('orders').insert({
        user_id: user?.id || null,
        buyer_roblox_username: robloxUsername.trim(),
        buyer_discord_username: discordUsername.trim() || null,
        buyer_email: email.trim() || null,
        subtotal_usd: subtotal,
        total_usd: subtotal,
        selected_crypto: selectedCrypto,
        expected_crypto_amount: payment.expectedAmount,
        payment_address: payment.walletAddress,
        payment_expires_at: payment.expiresAt,
        status: 'awaiting_payment',
      }).select().single();

      if (orderError) throw orderError;

      // Insert order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        product_name_snapshot: item.name,
        unit_price_usd: item.price_usd,
        quantity: item.quantity,
        total_price_usd: item.price_usd * item.quantity,
      }));
      await supabase.from('order_items').insert(orderItems);

      // Insert payment record
      await supabase.from('payments').insert({
        order_id: order.id,
        currency: selectedCrypto,
        network: payment.network || null,
        expected_amount: payment.expectedAmount,
        wallet_address: payment.walletAddress,
        expires_at: payment.expiresAt,
        status: 'pending',
      });

      // Insert order event
      await supabase.from('order_events').insert({
        order_id: order.id,
        event_type: 'order_created',
        event_message: 'Order created, awaiting payment',
      });

      setOrderCreated({ orderId: order.public_order_id, accessCode: order.access_code, payment });
      clearCart();
      toast.success('Order created! Send payment to the address below.');

      // Start countdown
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (items.length === 0 && !orderCreated) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-bold mb-4">Nothing to Checkout</h1>
          <Button onClick={() => navigate('/shop')} className="gradient-primary text-primary-foreground">Go Shopping</Button>
        </div>
      </Layout>
    );
  }

  if (orderCreated) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-10 max-w-2xl">
          <h1 className="font-display text-2xl font-bold mb-6 text-center">Complete Your Payment</h1>

          {/* Order ID */}
          <div className="bg-card border border-border rounded-lg p-4 mb-6 text-center">
            <p className="text-sm text-muted-foreground">Order ID</p>
            <p className="font-display text-xl font-bold text-primary">{orderCreated.orderId}</p>
            <p className="text-xs text-muted-foreground mt-1">Save this ID and your access code to track your order</p>
            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(orderCreated.accessCode)} className="mt-2 text-xs">
              Copy Access Code <Copy className="ml-1 h-3 w-3" />
            </Button>
          </div>

          {/* Payment Card */}
          <div className="bg-card border border-primary/30 rounded-lg p-6 glow-primary space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-display font-bold text-lg">{orderCreated.payment.currency}</span>
              {orderCreated.payment.network && <span className="text-xs bg-muted px-2 py-1 rounded">{orderCreated.payment.network}</span>}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Amount to Send</p>
              <div className="flex items-center gap-2">
                <code className="text-xl font-mono font-bold">{orderCreated.payment.expectedAmount}</code>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(orderCreated.payment.expectedAmount)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Send to Address</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono break-all bg-muted p-2 rounded flex-1">{orderCreated.payment.walletAddress}</code>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => copyToClipboard(orderCreated.payment.walletAddress)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* QR Placeholder */}
            <div className="w-40 h-40 mx-auto bg-muted rounded-lg flex items-center justify-center border border-border">
              <span className="text-xs text-muted-foreground">QR Code</span>
            </div>

            {/* Timer */}
            <div className="flex items-center justify-center gap-2 text-warning">
              <Clock className="h-4 w-4" />
              <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
              <span className="text-sm">remaining</span>
            </div>
          </div>

          {/* Warnings */}
          <div className="mt-6 space-y-2">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
              <span>Send the <strong>exact amount</strong> shown above. Incorrect amounts may delay your order.</span>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
              <span>Only send on the <strong>correct network</strong>. Wrong network may result in lost funds.</span>
            </div>
          </div>

          {/* Status */}
          <div className="mt-6 bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-3">Payment Status</p>
            <div className="flex items-center gap-3">
              {PAYMENT_STATUSES.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${PAYMENT_STATUSES.indexOf(paymentStatus as any) >= i ? 'gradient-primary' : 'bg-muted'}`} />
                  {i < PAYMENT_STATUSES.length - 1 && <div className={`w-8 h-0.5 ${PAYMENT_STATUSES.indexOf(paymentStatus as any) > i ? 'gradient-primary' : 'bg-muted'}`} />}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 capitalize">{paymentStatus.replace(/_/g, ' ')}</p>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-4">
            <Button variant="outline" className="flex-1" onClick={() => navigate(`/track?order=${orderCreated.orderId}`)}>
              Track This Order
            </Button>
            {paymentStatus === 'paid' && (
              <Button className="flex-1 gradient-primary text-primary-foreground" onClick={() => navigate(`/chat/${orderCreated.orderId}`)}>
                Open Order Chat
              </Button>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <h1 className="font-display text-3xl font-bold mb-8">Checkout</h1>
        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-3 space-y-6">
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="font-display text-lg font-bold">Your Information</h2>
              <div>
                <Label>Roblox Username *</Label>
                <Input value={robloxUsername} onChange={e => setRobloxUsername(e.target.value)} placeholder="Your Roblox username" className="bg-muted" />
              </div>
              <div>
                <Label>Discord Username <span className="text-muted-foreground">(optional)</span></Label>
                <Input value={discordUsername} onChange={e => setDiscordUsername(e.target.value)} placeholder="username#0000" className="bg-muted" />
              </div>
              <div>
                <Label>Email <span className="text-muted-foreground">(optional)</span></Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="For order updates" className="bg-muted" />
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="font-display text-lg font-bold">Select Cryptocurrency</h2>
              <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                <SelectTrigger className="bg-muted"><SelectValue placeholder="Choose crypto..." /></SelectTrigger>
                <SelectContent>
                  {(cryptos || []).map(c => (
                    <SelectItem key={c.currency_code} value={c.currency_code}>
                      {c.display_name} ({c.currency_code}){c.network_label ? ` - ${c.network_label}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-card border border-border rounded-lg p-6 space-y-4 sticky top-20">
              <h2 className="font-display text-lg font-bold">Order Summary</h2>
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.name}</span>
                  <span>${(item.price_usd * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-border pt-3 flex justify-between font-bold">
                <span>Total</span><span>${subtotal.toFixed(2)}</span>
              </div>
              <Button className="w-full gradient-primary text-primary-foreground glow-primary" size="lg" onClick={handleCreateOrder} disabled={loading}>
                {loading ? 'Creating Order...' : 'Place Order'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutPage;
