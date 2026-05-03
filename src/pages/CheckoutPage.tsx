import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Shield, Lock, ExternalLink, Tag, X } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatLineItem, generateOrderId, generateAccessCode } from '@/config/brand';
import { sendOrderConfirmationEmail } from '@/services/emailService';
import SupportCTA from '@/components/store/SupportCTA';

interface AppliedPromo {
  code: string;
  promo_id: string;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
  final_total: number;
}

const CheckoutPage = () => {
  const { items, subtotal, clearCart, getLineUnitPrice, getLineSubtotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [robloxUsername, setRobloxUsername] = useState('');
  const [discordUsername, setDiscordUsername] = useState('');
  const [email, setEmail] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [orderCreated, setOrderCreated] = useState<{ orderId: string; accessCode: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const discountAmount = appliedPromo?.discount_amount ?? 0;
  const finalTotal = Math.max(subtotal - discountAmount, 0);

  const copyToClipboard = (text: string, label?: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label || 'Text'} copied to clipboard`);
  };

  const validatePromoDirect = async (code: string, sub: number) => {
    console.log('[promo] validating via direct RPC (no edge function)', { code, sub });
    const { data, error } = await supabase.rpc('validate_promo_code', {
      p_code: code,
      p_subtotal: sub,
    });
    if (error) {
      console.error('[promo] RPC error', error);
      return { valid: false, reason: 'Could not validate promo code' };
    }
    const row = Array.isArray(data) ? data[0] : data;
    console.log('[promo] result', row);
    return row || { valid: false, reason: 'Invalid promo code' };
  };

  const handleApplyPromo = async () => {
    const code = promoInput.trim();
    if (!code) { toast.error('Enter a promo code'); return; }
    setApplyingPromo(true);
    try {
      const row: any = await validatePromoDirect(code, subtotal);
      if (!row?.valid) {
        toast.error(row?.reason || 'Invalid promo code');
        setAppliedPromo(null);
        return;
      }
      setAppliedPromo({
        code: row.code,
        promo_id: row.promo_id,
        discount_type: row.discount_type,
        discount_value: Number(row.discount_value),
        discount_amount: Number(row.discount_amount),
        final_total: Number(row.final_total),
      });
      toast.success(`Promo applied: -$${Number(row.discount_amount).toFixed(2)}`);
    } catch (err: any) {
      toast.error('Could not apply promo code');
    } finally {
      setApplyingPromo(false);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoInput('');
  };

  const handleCreateOrder = async () => {
    if (!robloxUsername.trim()) { toast.error('Roblox username is required'); return; }
    if (items.length === 0) { toast.error('Cart is empty'); return; }

    setLoading(true);
    try {
      // Re-validate promo at submit (server-side via RPC) to keep it honest
      let promoToUse = appliedPromo;
      if (promoToUse) {
        const revalidate: any = await validatePromoDirect(promoToUse.code, subtotal);
        if (!revalidate?.valid) {
          toast.error(revalidate?.reason || 'Promo code no longer valid');
          setAppliedPromo(null);
          setLoading(false);
          return;
        }
        promoToUse = {
          code: revalidate.code,
          promo_id: revalidate.promo_id,
          discount_type: revalidate.discount_type,
          discount_value: Number(revalidate.discount_value),
          discount_amount: Number(revalidate.discount_amount),
          final_total: Number(revalidate.final_total),
        };
      }

      const finalDiscount = promoToUse?.discount_amount ?? 0;
      const finalTotalUsd = Math.max(subtotal - finalDiscount, 0);

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
        discount_amount: finalDiscount,
        promo_code: promoToUse?.code || null,
        promo_code_id: promoToUse?.promo_id || null,
        total_usd: finalTotalUsd,
        status: 'awaiting_payment',
      });

      if (orderError) throw orderError;

      const { data: orderRow } = await supabase.rpc('lookup_order', {
        p_order_id: publicOrderId, p_access_code: accessCode,
      });

      const orderId = orderRow?.[0]?.id;
      if (orderId) {
        const orderItems = items.map(item => ({
          order_id: orderId,
          product_id: null,
          product_name_snapshot: item.name,
          product_type_snapshot: item.product_type,
          unit_price_usd: getLineUnitPrice(item),
          quantity: item.quantity,
          total_price_usd: getLineSubtotal(item),
        }));
        await supabase.from('order_items').insert(orderItems);

        await supabase.from('order_events').insert({
          order_id: orderId,
          event_type: 'order_created',
          event_message: promoToUse
            ? `Order created with promo ${promoToUse.code} (-$${finalDiscount.toFixed(2)})`
            : 'Order created, proceeding to payment',
          metadata: promoToUse ? { promo_code: promoToUse.code, discount_amount: finalDiscount } : null,
        });
      }

      setOrderCreated({ orderId: publicOrderId, accessCode });
      clearCart();

      const recipientEmail = email.trim() || user?.email;
      if (recipientEmail) {
        const itemsSummary = items.map(i => formatLineItem(i.name, i.quantity)).join(', ');
        sendOrderConfirmationEmail(recipientEmail, {
          orderId: publicOrderId,
          accessCode,
          itemsSummary,
          subtotalUsd: subtotal.toFixed(2),
          promoCode: promoToUse?.code,
          discountAmount: finalDiscount.toFixed(2),
          totalUsd: finalTotalUsd.toFixed(2),
        });
      }

      toast.success('Order created! Redirecting to payment...');

      if (finalTotalUsd === 0) {
        setRedirecting(false);
        return;
      }

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

      window.location.href = invoiceData.payment_url;
    } catch (err: any) {
      toast.error(err.message || 'Failed to create order');
      setLoading(false);
      setRedirecting(false);
    }
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
              ⚠️ Save your Order ID and Access Code — you'll need them to track your order and reference it when contacting support.
            </p>
          </div>

          {!redirecting && <SupportCTA orderId={orderCreated.orderId} className="mb-6" />}

          {redirecting && (
            <div className="text-center space-y-4">
              <div className="animate-pulse text-primary font-semibold">
                <ExternalLink className="h-5 w-5 inline mr-2" />
                Opening secure payment page...
              </div>
              <p className="text-sm text-muted-foreground">Choose your preferred cryptocurrency on the payment page.</p>
            </div>
          )}

          {!redirecting && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                {finalTotal === 0
                  ? 'This is a free order — no payment needed!'
                  : "If you weren't redirected, click below to complete payment."}
              </p>
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1" onClick={() => navigate(`/track?order=${orderCreated.orderId}`)}>
                  Track Order
                </Button>
                {finalTotal > 0 && (
                  <Button className="flex-1 gradient-primary text-primary-foreground"
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
                )}
              </div>
            </div>
          )}
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
                <Label>Email <span className="text-muted-foreground">(optional, for order updates)</span></Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="For order updates" className="bg-muted" />
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 space-y-3">
              <h2 className="font-display text-lg font-bold flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> Secure Crypto Payment
              </h2>
              <p className="text-sm text-muted-foreground">
                After placing your order, you'll be redirected to a secure payment page where you can choose your preferred cryptocurrency.
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
              {items.map(item => {
                const unitPrice = getLineUnitPrice(item);
                const lineTotal = getLineSubtotal(item);
                return (
                  <div key={item.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{formatLineItem(item.name, item.quantity)}</span>
                      <span>${lineTotal.toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground pl-2">@ ${unitPrice.toFixed(2)} each</div>
                  </div>
                );
              })}

              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                {/* Promo code */}
                {!appliedPromo ? (
                  <div className="flex gap-2 pt-1">
                    <Input
                      value={promoInput}
                      onChange={e => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="Promo code"
                      className="bg-muted h-9"
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleApplyPromo(); } }}
                    />
                    <Button size="sm" variant="outline" onClick={handleApplyPromo} disabled={applyingPromo}>
                      {applyingPromo ? '...' : 'Apply'}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-success/10 border border-success/30 rounded-md px-3 py-2 text-sm">
                    <div className="flex items-center gap-2 text-success">
                      <Tag className="h-4 w-4" />
                      <span className="font-mono font-semibold">{appliedPromo.code}</span>
                    </div>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={removePromo}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {appliedPromo && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Discount{appliedPromo.discount_type === 'percentage' ? ` (${appliedPromo.discount_value}%)` : ''}</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-3 flex justify-between font-bold">
                <span>Total</span>
                <span key={finalTotal} className="price-pop">${finalTotal.toFixed(2)}</span>
              </div>
              <Button
                className="w-full gradient-primary text-primary-foreground glow-primary hover-lift btn-press" size="lg"
                onClick={handleCreateOrder} disabled={loading || redirecting}
              >
                <Lock className="mr-2 h-4 w-4" />
                {loading ? 'Creating Order...' : redirecting ? 'Redirecting...' : finalTotal === 0 ? 'Place Free Order' : 'Proceed to Secure Payment'}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                After payment, contact support with your Order ID to claim items.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutPage;
