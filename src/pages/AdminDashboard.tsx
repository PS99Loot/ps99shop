import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Navigate, Link } from 'react-router-dom';
import StatusBadge from '@/components/store/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, Package, ShoppingBag, CreditCard, Search, AlertTriangle, DollarSign, TrendingUp, LogOut, Tag, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { BRAND } from '@/config/brand';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PromoCodesManager from './admin/PromoCodesManager';

const ORDER_STATUSES = ['awaiting_payment','payment_detected','confirming','paid','queued_for_delivery','in_delivery','completed','disputed','expired','cancelled','refunded'] as const;
const PAID_STATUSES = ['paid','queued_for_delivery','in_delivery','completed'];

function isAdminAuthenticated(): boolean {
  const token = sessionStorage.getItem('admin_token');
  const expiry = sessionStorage.getItem('admin_expiry');
  if (!token || !expiry) return false;
  return Date.now() < Number(expiry);
}

const AdminDashboard = () => {
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const authenticated = isAdminAuthenticated();

  const { data: orders, refetch: refetchOrders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      return data || [];
    },
    enabled: authenticated,
  });

  const { data: products } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      return data || [];
    },
    enabled: authenticated,
  });

  const { data: payments } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const { data } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
      return data || [];
    },
    enabled: authenticated,
  });

  const { data: creditTx } = useQuery({
    queryKey: ['admin-credit-tx'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('credit_transactions').select('*').order('created_at', { ascending: false }).limit(500);
      return data || [];
    },
    enabled: authenticated,
  });

  const { data: cpxPostbacks } = useQuery({
    queryKey: ['admin-cpx-postbacks'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('cpx_postbacks').select('*').order('created_at', { ascending: false }).limit(500);
      return data || [];
    },
    enabled: authenticated,
  });

  const paidOrders = useMemo(() => (orders || []).filter(o => PAID_STATUSES.includes(o.status)), [orders]);
  const totalRevenue = useMemo(() => paidOrders.reduce((s, o) => s + Number(o.total_usd), 0), [paidOrders]);

  const earningsData = useMemo(() => {
    const byDay: Record<string, number> = {};
    paidOrders.forEach(o => {
      const day = new Date(o.created_at).toISOString().slice(0, 10);
      byDay[day] = (byDay[day] || 0) + Number(o.total_usd);
    });
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ date, amount: Number(amount.toFixed(2)) }));
  }, [paidOrders]);

  if (!authenticated) return <Navigate to="/admin/login" replace />;

  const filteredOrders = (orders || []).filter(o => {
    if (orderFilter !== 'all' && o.status !== orderFilter) return false;
    if (orderSearch && !o.public_order_id.toLowerCase().includes(orderSearch.toLowerCase()) && !o.buyer_roblox_username.toLowerCase().includes(orderSearch.toLowerCase())) return false;
    return true;
  });

  const pendingOrders = (orders || []).filter(o => o.status === 'awaiting_payment').length;
  const completedOrders = (orders || []).filter(o => o.status === 'completed').length;
  const lowStock = (products || []).filter(p => p.stock_quantity - p.reserved_quantity <= 2 && p.active);

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status: status as any }).eq('id', orderId);
    if (error) toast.error(error.message); else { toast.success('Status updated'); refetchOrders(); }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_expiry');
    window.location.href = '/admin/login';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <img src="/shoplogo.png" alt={BRAND.name} className="h-8 w-8 object-contain" />
            <span className="font-display text-lg font-bold text-gradient">{BRAND.name}</span>
          </Link>
          <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded">Admin</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
          <LogOut className="h-4 w-4 mr-1" /> Logout
        </Button>
      </div>

      <div className="p-4 md:p-6">
        <Tabs defaultValue="overview">
          <TabsList className="bg-card border border-border mb-6 flex-wrap h-auto">
            <TabsTrigger value="overview"><LayoutDashboard className="h-4 w-4 mr-1" /> Overview</TabsTrigger>
            <TabsTrigger value="orders"><ShoppingBag className="h-4 w-4 mr-1" /> Orders</TabsTrigger>
            <TabsTrigger value="products"><Package className="h-4 w-4 mr-1" /> Products</TabsTrigger>
            <TabsTrigger value="payments"><CreditCard className="h-4 w-4 mr-1" /> Payments</TabsTrigger>
            <TabsTrigger value="promos"><Tag className="h-4 w-4 mr-1" /> Promo Codes</TabsTrigger>
            <TabsTrigger value="credit"><Wallet className="h-4 w-4 mr-1" /> Store Credit</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign },
                { label: 'Total Orders', value: orders?.length || 0, icon: ShoppingBag },
                { label: 'Pending', value: pendingOrders, icon: AlertTriangle },
                { label: 'Completed', value: completedOrders, icon: TrendingUp },
              ].map(s => (
                <div key={s.label} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <s.icon className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                  <p className="text-2xl font-bold mt-1">{s.value}</p>
                </div>
              ))}
            </div>

            {earningsData.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold mb-4">Earnings Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={earningsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `$${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                    />
                    <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {lowStock.length > 0 && (
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-2"><AlertTriangle className="h-4 w-4 text-warning" /><span className="font-semibold text-sm">Low Stock Alerts</span></div>
                {lowStock.map(p => <p key={p.id} className="text-sm text-muted-foreground">{p.name}: {p.stock_quantity - p.reserved_quantity} remaining</p>)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders">
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search orders..." className="pl-10 bg-card" value={orderSearch} onChange={e => setOrderSearch(e.target.value)} /></div>
              <Select value={orderFilter} onValueChange={setOrderFilter}>
                <SelectTrigger className="w-48 bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {ORDER_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="p-3">Order</th><th className="p-3">Roblox</th><th className="p-3">Subtotal</th><th className="p-3">Promo</th><th className="p-3">Discount</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3">Date</th><th className="p-3">Actions</th>
                  </tr></thead>
                  <tbody>
                    {filteredOrders.map(o => (
                      <tr key={o.id} className="border-b border-border hover:bg-muted/30">
                        <td className="p-3 font-mono text-xs">{o.public_order_id}</td>
                        <td className="p-3">{o.buyer_roblox_username}</td>
                        <td className="p-3">${Number(o.subtotal_usd).toFixed(2)}</td>
                        <td className="p-3 font-mono text-xs">{(o as any).promo_code || '—'}</td>
                        <td className="p-3 text-xs">{Number((o as any).discount_amount || 0) > 0 ? `-$${Number((o as any).discount_amount).toFixed(2)}` : '—'}</td>
                        <td className="p-3 font-semibold">${Number(o.total_usd).toFixed(2)}</td>
                        <td className="p-3"><StatusBadge status={o.status} /></td>
                        <td className="p-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Select onValueChange={(v) => updateOrderStatus(o.id, v)}>
                              <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="Update..." /></SelectTrigger>
                              <SelectContent>{ORDER_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g,' ')}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredOrders.length === 0 && <p className="p-8 text-center text-muted-foreground text-sm">No orders found</p>}
            </div>
          </TabsContent>

          <TabsContent value="products">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="p-3">Name</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3">Reserved</th><th className="p-3">Featured</th><th className="p-3">Active</th>
                  </tr></thead>
                  <tbody>
                    {(products || []).map(p => (
                      <tr key={p.id} className="border-b border-border hover:bg-muted/30">
                        <td className="p-3 font-semibold">{p.name}</td>
                        <td className="p-3">${Number(p.price_usd).toFixed(2)}</td>
                        <td className="p-3">{p.stock_quantity}</td>
                        <td className="p-3">{p.reserved_quantity}</td>
                        <td className="p-3">{p.featured ? '⭐' : '-'}</td>
                        <td className="p-3">{p.active ? '✅' : '❌'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payments">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="p-3">Order</th><th className="p-3">Currency</th><th className="p-3">Expected</th><th className="p-3">Received</th><th className="p-3">Status</th><th className="p-3">Date</th>
                  </tr></thead>
                  <tbody>
                    {(payments || []).map(p => (
                      <tr key={p.id} className="border-b border-border hover:bg-muted/30">
                        <td className="p-3 font-mono text-xs">{p.order_id.slice(0,8)}...</td>
                        <td className="p-3">{p.currency}</td>
                        <td className="p-3 font-mono">{p.expected_amount}</td>
                        <td className="p-3 font-mono">{p.received_amount || '-'}</td>
                        <td className="p-3"><StatusBadge status={p.status} /></td>
                        <td className="p-3 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(payments || []).length === 0 && <p className="p-8 text-center text-muted-foreground text-sm">No payments found</p>}
            </div>
          </TabsContent>

          <TabsContent value="promos">
            <PromoCodesManager />
          </TabsContent>

          <TabsContent value="credit">
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-3">Credit transactions ({(creditTx || []).length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="p-2">Date</th><th className="p-2">User</th><th className="p-2">Type</th><th className="p-2">Amount</th><th className="p-2">Balance</th><th className="p-2">Reference</th>
                    </tr></thead>
                    <tbody>
                      {(creditTx || []).map((t: any) => (
                        <tr key={t.id} className="border-b border-border hover:bg-muted/30">
                          <td className="p-2 text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</td>
                          <td className="p-2 font-mono text-xs">{String(t.user_id).slice(0,8)}…</td>
                          <td className="p-2"><span className="px-2 py-0.5 rounded bg-muted text-xs">{t.type}</span></td>
                          <td className={`p-2 font-mono ${Number(t.amount) >= 0 ? 'text-success' : 'text-destructive'}`}>{Number(t.amount) >= 0 ? '+' : ''}${Number(t.amount).toFixed(2)}</td>
                          <td className="p-2 font-mono">${Number(t.balance_after).toFixed(2)}</td>
                          <td className="p-2 font-mono text-xs">{t.reference || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {(creditTx || []).length === 0 && <p className="p-6 text-center text-muted-foreground text-sm">No credit activity yet</p>}
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-3">CPX Research postbacks ({(cpxPostbacks || []).length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="p-2">Date</th><th className="p-2">Trans ID</th><th className="p-2">User</th><th className="p-2">Amount</th><th className="p-2">Status</th><th className="p-2">IP</th>
                    </tr></thead>
                    <tbody>
                      {(cpxPostbacks || []).map((p: any) => (
                        <tr key={p.id} className="border-b border-border hover:bg-muted/30">
                          <td className="p-2 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</td>
                          <td className="p-2 font-mono text-xs">{p.trans_id}</td>
                          <td className="p-2 font-mono text-xs">{String(p.ext_user_id || '').slice(0,8)}…</td>
                          <td className="p-2 font-mono">${Number(p.amount_usd).toFixed(2)}</td>
                          <td className="p-2 text-xs">{p.status}</td>
                          <td className="p-2 font-mono text-xs">{p.ip || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {(cpxPostbacks || []).length === 0 && <p className="p-6 text-center text-muted-foreground text-sm">No CPX postbacks yet</p>}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
