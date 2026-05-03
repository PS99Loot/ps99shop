import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Wallet, Copy, ExternalLink } from 'lucide-react';

const WalletPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [topupAmount, setTopupAmount] = useState('10');
  const [loading, setLoading] = useState(false);
  const [tx, setTx] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  const refresh = async () => {
    if (!user) return;
    const { data: prof } = await (supabase as any).from('profiles').select('store_credit_usd, referral_code').eq('id', user.id).maybeSingle();
    setBalance(Number(prof?.store_credit_usd ?? 0));
    setReferralCode(prof?.referral_code ?? null);
    const { data: txs } = await (supabase as any).from('credit_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
    setTx(txs ?? []);
    const { data: rw } = await (supabase as any).from('referral_rewards').select('*').eq('referrer_user_id', user.id).order('created_at', { ascending: false }).limit(50);
    setRewards(rw ?? []);
  };

  useEffect(() => { refresh(); }, [user]);

  const handleTopup = async () => {
    const amount = Number(topupAmount);
    if (!Number.isFinite(amount) || amount < 1) { toast.error('Enter at least $1'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('credit-topup-create', { body: { amount } });
      if (error || !data?.payment_url) throw new Error(data?.error || error?.message || 'Failed to create top-up');
      window.location.href = data.payment_url;
    } catch (e: any) {
      toast.error(e.message || 'Top-up failed');
      setLoading(false);
    }
  };

  const referralLink = referralCode ? `${window.location.origin}/r/${referralCode}` : '';

  if (!authLoading && !user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 max-w-md text-center space-y-4">
          <h1 className="font-display text-2xl font-bold">Sign in required</h1>
          <p className="text-muted-foreground">Please sign up or log in to continue.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/login')}>Log In</Button>
            <Button variant="outline" onClick={() => navigate('/login')}>Sign Up</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-3xl space-y-8">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="h-6 w-6 text-primary" />
            <h1 className="font-display text-2xl font-bold">Store Credit</h1>
          </div>
          <p className="text-sm text-muted-foreground">Available balance</p>
          <p className="text-4xl font-bold text-primary">${balance.toFixed(2)}</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 className="font-display text-lg font-bold">Top up with crypto</h2>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label>Amount (USD)</Label>
              <Input type="number" min={1} step="0.01" value={topupAmount} onChange={e => setTopupAmount(e.target.value)} className="bg-muted" />
            </div>
            <Button onClick={handleTopup} disabled={loading} className="gradient-primary text-primary-foreground">
              {loading ? 'Creating…' : 'Top up'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Balance is credited automatically after blockchain confirmation.</p>
        </div>

        {referralCode && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-3">
            <h2 className="font-display text-lg font-bold">Your referral link</h2>
            <p className="text-sm text-muted-foreground">Earn 5% store credit on every paid order from people you refer.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-muted rounded text-sm break-all">{referralLink}</code>
              <Button size="icon" variant="outline" onClick={() => { navigator.clipboard.writeText(referralLink); toast.success('Copied'); }}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="font-display text-lg font-bold mb-3">Transaction history</h2>
          {tx.length === 0 ? <p className="text-sm text-muted-foreground">No transactions yet.</p> : (
            <div className="space-y-2 text-sm">
              {tx.map(t => (
                <div key={t.id} className="flex justify-between border-b border-border/50 pb-1">
                  <div>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted mr-2">{t.type}</span>
                    {t.note}
                  </div>
                  <div className={Number(t.amount) >= 0 ? 'text-success' : 'text-destructive'}>
                    {Number(t.amount) >= 0 ? '+' : ''}${Number(t.amount).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {rewards.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-display text-lg font-bold mb-3">Referral rewards</h2>
            <div className="space-y-2 text-sm">
              {rewards.map(r => (
                <div key={r.id} className="flex justify-between">
                  <span>Order reward</span>
                  <span className="text-success">+${Number(r.reward_amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default WalletPage;
