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
import Trustpilot from '@/components/store/Trustpilot';

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

  // Direct table query — no RPC, no edge function. RLS allows public SELECT on promo_codes.
  const validatePromoDirect = async (code: string, sub: number) => {
    const trimmed = code.trim();
    if (!trimmed) return { valid: false, reason: 'Invalid promo code' };

    const { data, error } = await supabase
      .from('promo_codes')
      .select('id, code, active, discount_type, discount_value, expiration_date, usage_limit, usage_count')
      .ilike('code', trimmed)
      .maybeSingle();

    if (error) {
      console.error('[promo] query error', error);
      return { valid: false, reason: 'Invalid promo code' };
    }
    if (!data) return { valid: false, reason: 'Invalid promo code' };
    if (!data.active) return { valid: false, reason: 'Inactive promo code' };
    if (data.expiration_date && new Date(data.expiration_date) < new Date()) {
      return { valid: false, reason: 'Expired promo code' };
    }
    if (data.usage_limit !== null && data.usage_count >= data.usage_limit) {
      return { valid: false, reason: 'Usage limit reached' };
    }

    const dv = Number(data.discount_value);
    let discount = data.discount_type === 'percentage'
      ? Math.round((sub * dv) / 100 * 100) / 100
      : dv;
    if (discount > sub) discount = sub;
    const finalTotal = Math.max(sub - discount, 0);

    return {
      valid: true,
      promo_id: data.id,
      code: data.code,
      discount_type: data.discount_type,
      discount_value: dv,
      discount_amount: discount,
      final_total: finalTotal,
    };
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
        code: row.promo_code ?? row.code,
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
    const trimmedEmail = email.trim();
    if (!trimmedEmail) { toast.error('Email is required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) { toast.error('Please enter a valid email'); return; }
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
          code: revalidate.promo_code ?? revalidate.code,
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

      // Resolve referrer (cookie) — server-side validation: not self, must exist
      const refCode = getReferralCookie();
      let referrerUserId: string | null = null;
      if (refCode) {
        const { data: refRow } = await (supabase as any)
          .from('profiles').select('id').eq('referral_code', refCode.toUpperCase()).maybeSingle();
        if (refRow?.id && refRow.id !== user?.id) referrerUserId = refRow.id;
      }

      const { error: orderError } = await supabase.from('orders').insert({
        public_order_id: publicOrderId,
        access_code: accessCode,
        user_id: user?.id || null,
        buyer_roblox_username: robloxUsername.trim(),
        buyer_email: trimmedEmail,
        subtotal_usd: subtotal,
        discount_amount: finalDiscount,
        promo_code: promoToUse?.code || null,
        promo_code_id: promoToUse?.promo_id || null,
        total_usd: finalTotalUsd,
        status: 'awaiting_payment',
        ...(referrerUserId ? { referrer_user_id: referrerUserId, referral_code: refCode?.toUpperCase() } : {}),
        payment_method: paymentMethod,
      } as any);

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

      const itemsSummary = items.map(i => formatLineItem(i.name, i.quantity)).join(', ');
      sendOrderConfirmationEmail(trimmedEmail, {
        orderId: publicOrderId,
        accessCode,
        itemsSummary,
        subtotalUsd: subtotal.toFixed(2),
        promoCode: promoToUse?.code,
        discountAmount: finalDiscount.toFixed(2),
        totalUsd: finalTotalUsd.toFixed(2),
      });

      toast.success('Order created! Redirecting to payment...');

      if (finalTotalUsd === 0) {
        setRedirecting(false);
        return;
      }

      // STORE CREDIT path
      if (paymentMethod === 'store_credit') {
        const { data: payRes, error: payErr } = await (supabase as any).rpc('pay_order_with_credit', {
          p_order_id: publicOrderId, p_access_code: accessCode,
        });
        const row = Array.isArray(payRes) ? payRes[0] : payRes;
        if (payErr || !row?.success) {
          toast.error(row?.message || payErr?.message || 'Could not pay with credit');
          return;
        }
        toast.success('Order paid with store credit');
        setStoreCredit(Number(row.balance_after ?? 0));
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

  if (!user && !orderCreated) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 max-w-md text-center space-y-4">
          <h1 className="font-display text-2xl font-bold">Sign in required</h1>
          <p className="text-muted-foreground">Please sign up or log in to continue.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/login')} className="gradient-primary text-primary-foreground">Log In</Button>
            <Button variant="outline" onClick={() => navigate('/login')}>Sign Up</Button>
          </div>
        </div>
      </Layout>
    );
  }

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
                <Label>Email *</Label>
                <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="bg-muted" />
                <p className="text-xs text-muted-foreground mt-1">Used to send your order confirmation.</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 space-y-3">
              <h2 className="font-display text-lg font-bold flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> Secure Crypto Payment
              </h2>
              {user && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Payment method</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('crypto')}
                      className={`border rounded-md p-3 text-left text-sm ${paymentMethod === 'crypto' ? 'border-primary bg-primary/10' : 'border-border'}`}
                    >
                      <div className="font-semibold flex items-center gap-2"><Lock className="h-4 w-4" /> Crypto</div>
                      <div className="text-xs text-muted-foreground mt-1">BTC, ETH, USDT…</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('store_credit')}
                      disabled={storeCredit < finalTotal}
                      className={`border rounded-md p-3 text-left text-sm disabled:opacity-50 ${paymentMethod === 'store_credit' ? 'border-primary bg-primary/10' : 'border-border'}`}
                    >
                      <div className="font-semibold flex items-center gap-2"><Wallet className="h-4 w-4" /> Store Credit</div>
                      <div className="text-xs text-muted-foreground mt-1">Balance: ${storeCredit.toFixed(2)}</div>
                    </button>
                  </div>
                  {paymentMethod === 'store_credit' && storeCredit < finalTotal && (
                    <p className="text-xs text-destructive">Insufficient balance. <a href="/wallet" className="underline">Top up</a>.</p>
                  )}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                {paymentMethod === 'crypto'
                  ? "After placing your order, you'll be redirected to a secure payment page where you can choose your preferred cryptocurrency."
                  : 'Your store credit balance will be charged instantly.'}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                Powered by OxaPay — safe and fast crypto payments
              </div>
              {paymentMethod === 'crypto' && (
                <div className="mt-3 p-3 rounded-md border border-primary/30 bg-primary/5">
                  <p className="text-sm font-semibold">Don't have crypto? No problem!</p>
                  <p className="text-xs text-muted-foreground mb-2">Buy crypto instantly and complete your order.</p>
                  <a
                    href="https://swapped.com/trade"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                  >
                    Buy Crypto <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
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
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover-lift btn-press" size="lg"
                onClick={handleCreateOrder} disabled={loading || redirecting}
              >
                <Lock className="mr-2 h-4 w-4" />
                {loading ? 'Creating Order...' : redirecting ? 'Redirecting...' : finalTotal === 0 ? 'Place Free Order' : 'Proceed to Secure Payment'}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                After payment, contact support with your Order ID to claim items.
              </p>
              <div className="flex justify-center pt-1">
                <Trustpilot variant="inline" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutPage;
