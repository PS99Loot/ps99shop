import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Shield, Lock, Sparkles, ExternalLink } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BRAND, getUnitPrice, generateOrderId, generateAccessCode } from '@/config/brand';

const CheckoutPage = () => {
  const { items, subtotal, clearCart, totalItems } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [robloxUsername, setRobloxUsername] = useState('');
  const [discordUsername, setDiscordUsername] = useState('');
  const [email, setEmail] = useState('');
  const [orderCreated, setOrderCreated] = useState<{
    orderId: string;
    accessCode: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const unitPrice = getUnitPrice(totalItems);
  const isBulk = totalItems >= BRAND.bulkThreshold;

  const copyToClipboard = (text: string, label?: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label || 'Text'} copied to clipboard`);
  };

  const handleCreateOrder = async () => {
    if (!robloxUsername.trim()) { toast.error('Roblox username is required'); return; }
    if (items.length === 0) { toast.error('Cart is empty'); return; }

    setLoading(true);
    try {
      const publicOrderId = generateOrderId();
      const accessCode = generateAccessCode();

      const { error: orderError } = await supabase.from('orders').insert({
        public_order_id: publicOrderId,
        access_code: accessCode,
        user_id: user?.id || null,
        buyer_roblox_username: robloxUsername.trim(),
        buyer_discord_username: discordUsername.trim() || null,
        buyer_email: email.trim() || null,
        subtotal_usd: subtotal,
        total_usd: subtotal,
        status: 'awaiting_payment',
      });

      if (orderError) throw orderError;

      // Look up order to get UUID for child tables
      const { data: orderRow } = await supabase.rpc('lookup_order', {
        p_order_id: publicOrderId,
        p_access_code: accessCode,
      });

      const orderId = orderRow?.[0]?.id;
      if (orderId) {
        const orderItems = items.map(item => ({
          order_id: orderId,
          product_id: null,
          product_name_snapshot: item.name,
          unit_price_usd: unitPrice,
          quantity: item.quantity,
          total_price_usd: unitPrice * item.quantity,
        }));
        await supabase.from('order_items').insert(orderItems);

        await supabase.from('order_events').insert({
          order_id: orderId,
          event_type: 'order_created',
          event_message: 'Order created, proceeding to payment',
        });
      }

      setOrderCreated({ orderId: publicOrderId, accessCode });
      clearCart();
      toast.success('Order created! Redirecting to payment...');

      // Now create OxaPay invoice and redirect
      setRedirecting(true);
      const { data: invoiceData, error: invoiceError } = await supabase.functions.invoke(
        'oxapay-create-invoice',
        { body: { orderId: publicOrderId, accessCode } }
      );

      if (invoiceError || !invoiceData?.payment_url) {
        toast.error('Payment setup failed. You can pay later from order tracking.');
        setRedirecting(false);
        return;
      }

      // Redirect to OxaPay payment page
      window.location.href = invoiceData.payment_url;
    } catch (err: any) {
      toast.error(err.message || 'Failed to create order');
      setLoading(false);
      setRedirecting(false);
    }
  };

  // Empty cart and no order yet
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

  // Order created — show confirmation with credentials
  if (orderCreated) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-10 max-w-2xl">
          <h1 className="font-display text-2xl font-bold mb-6 text-center">
            {redirecting ? 'Redirecting to Payment...' : 'Order Created'}
          </h1>

          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Order ID</p>
                <div className="flex items-center gap-2">
                  <p className="font-display text-lg font-bold text-primary">{orderCreated.orderId}</p>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(orderCreated.orderId, 'Order ID')}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Access Code</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm font-bold">{orderCreated.accessCode}</p>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(orderCreated.accessCode, 'Access code')}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              ⚠️ Save your Order ID and Access Code — you'll need them to track your order and chat with support.
            </p>
          </div>

          {redirecting && (
            <div className="text-center space-y-4">
              <div className="animate-pulse text-primary font-semibold">
                <ExternalLink className="h-5 w-5 inline mr-2" />
                Opening secure payment page...
              </div>
              <p className="text-sm text-muted-foreground">
                Choose your preferred cryptocurrency on the payment page.
              </p>
            </div>
          )}

          {!redirecting && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                If you weren't redirected, click below to complete payment.
              </p>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate(`/track?order=${orderCreated.orderId}`)}
                >
                  Track Order
                </Button>
                <Button
                  className="flex-1 gradient-primary text-primary-foreground"
                  onClick={async () => {
                    setRedirecting(true);
                    const { data } = await supabase.functions.invoke('oxapay-create-invoice', {
                      body: { orderId: orderCreated.orderId, accessCode: orderCreated.accessCode },
                    });
                    if (data?.payment_url) {
                      window.location.href = data.payment_url;
                    } else {
                      toast.error('Could not get payment link');
                      setRedirecting(false);
                    }
                  }}
                >
                  <Lock className="mr-2 h-4 w-4" /> Pay Now
                </Button>
              </div>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // Main checkout form
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
                <Label>Email <span className="text-muted-foreground">(optional, for order updates)</span></Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="For order updates" className="bg-muted" />
              </div>
            </div>

            {/* Payment info */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-3">
              <h2 className="font-display text-lg font-bold flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> Secure Crypto Payment
              </h2>
              <p className="text-sm text-muted-foreground">
                After placing your order, you'll be redirected to a secure payment page where you can choose your preferred cryptocurrency (BTC, ETH, LTC, USDT, and more).
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                Powered by OxaPay — safe and fast crypto payments
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-card border border-border rounded-lg p-6 space-y-4 sticky top-20">
              <h2 className="font-display text-lg font-bold">Order Summary</h2>
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.name}</span>
                  <span>${(unitPrice * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="text-xs text-muted-foreground">
                {totalItems} huges @ ${unitPrice.toFixed(2)} each
              </div>
              {isBulk && (
                <div className="flex items-center gap-1 text-sm text-success font-medium">
                  <Sparkles className="h-4 w-4" />
                  {BRAND.bulkDiscountPercent}% bulk discount applied!
                </div>
              )}
              <div className="border-t border-border pt-3 flex justify-between font-bold">
                <span>Total</span><span>${subtotal.toFixed(2)}</span>
              </div>
              <Button
                className="w-full gradient-primary text-primary-foreground glow-primary"
                size="lg"
                onClick={handleCreateOrder}
                disabled={loading || redirecting}
              >
                {loading ? 'Creating Order...' : redirecting ? 'Redirecting...' : 'Continue to Secure Payment'}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                You'll choose your crypto on the next page
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutPage;
