import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  active: boolean;
  usage_limit: number | null;
  usage_count: number;
  expiration_date: string | null;
  created_at: string;
}

interface FormState {
  id?: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: string;
  active: boolean;
  usage_limit: string;
  expiration_date: string;
}

const emptyForm: FormState = {
  code: '',
  discount_type: 'percentage',
  discount_value: '',
  active: true,
  usage_limit: '',
  expiration_date: '',
};

function getAdminAuth() {
  return {
    token: sessionStorage.getItem('admin_token') || '',
    expiry: Number(sessionStorage.getItem('admin_expiry') || 0),
  };
}

const PromoCodesManager = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const { data: promos, refetch, isLoading } = useQuery({
    queryKey: ['admin-promo-codes'],
    queryFn: async (): Promise<PromoCode[]> => {
      const auth = getAdminAuth();
      const { data, error } = await supabase.functions.invoke('admin-promo-codes', {
        body: { action: 'list', token: auth.token, expiry: auth.expiry },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data?.data || [];
    },
  });

  const openCreate = () => { setForm(emptyForm); setOpen(true); };
  const openEdit = (p: PromoCode) => {
    setForm({
      id: p.id,
      code: p.code,
      discount_type: p.discount_type,
      discount_value: String(p.discount_value),
      active: p.active,
      usage_limit: p.usage_limit != null ? String(p.usage_limit) : '',
      expiration_date: p.expiration_date ? p.expiration_date.slice(0, 16) : '',
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) { toast.error('Code is required'); return; }
    if (!form.discount_value || Number(form.discount_value) < 0) { toast.error('Invalid discount value'); return; }
    if (form.discount_type === 'percentage' && Number(form.discount_value) > 100) {
      toast.error('Percentage cannot exceed 100'); return;
    }
    setSaving(true);
    try {
      const auth = getAdminAuth();
      const payload: Record<string, unknown> = {
        code: form.code,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        active: form.active,
        usage_limit: form.usage_limit === '' ? null : Number(form.usage_limit),
        expiration_date: form.expiration_date ? new Date(form.expiration_date).toISOString() : null,
      };
      if (form.id) payload.id = form.id;

      const { data, error } = await supabase.functions.invoke('admin-promo-codes', {
        body: {
          action: form.id ? 'update' : 'create',
          token: auth.token, expiry: auth.expiry, payload,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(form.id ? 'Promo updated' : 'Promo created');
      setOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this promo code?')) return;
    try {
      const auth = getAdminAuth();
      const { data, error } = await supabase.functions.invoke('admin-promo-codes', {
        body: { action: 'delete', token: auth.token, expiry: auth.expiry, payload: { id } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Promo deleted');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">Manage discount codes for checkout.</p>
        <Button onClick={openCreate} className="gradient-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-1" /> New Promo Code
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="p-3">Code</th><th className="p-3">Type</th><th className="p-3">Value</th>
              <th className="p-3">Used</th><th className="p-3">Expires</th><th className="p-3">Active</th><th className="p-3">Actions</th>
            </tr></thead>
            <tbody>
              {(promos || []).map(p => (
                <tr key={p.id} className="border-b border-border hover:bg-muted/30">
                  <td className="p-3 font-mono font-semibold">{p.code}</td>
                  <td className="p-3">{p.discount_type}</td>
                  <td className="p-3">{p.discount_type === 'percentage' ? `${p.discount_value}%` : `$${Number(p.discount_value).toFixed(2)}`}</td>
                  <td className="p-3">{p.usage_count}{p.usage_limit ? ` / ${p.usage_limit}` : ''}</td>
                  <td className="p-3 text-xs">{p.expiration_date ? new Date(p.expiration_date).toLocaleDateString() : '—'}</td>
                  <td className="p-3">{p.active ? '✅' : '❌'}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && (promos || []).length === 0 && (
          <p className="p-8 text-center text-muted-foreground text-sm">No promo codes yet</p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit Promo Code' : 'New Promo Code'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Code *</Label>
              <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SAVE10" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type *</Label>
                <Select value={form.discount_type} onValueChange={(v: any) => setForm({ ...form, discount_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Value *</Label>
                <Input type="number" step="0.01" min="0" value={form.discount_value}
                  onChange={e => setForm({ ...form, discount_value: e.target.value })}
                  placeholder={form.discount_type === 'percentage' ? '10' : '5.00'} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Usage Limit (optional)</Label>
                <Input type="number" min="1" value={form.usage_limit}
                  onChange={e => setForm({ ...form, usage_limit: e.target.value })} placeholder="∞" />
              </div>
              <div>
                <Label>Expires (optional)</Label>
                <Input type="datetime-local" value={form.expiration_date}
                  onChange={e => setForm({ ...form, expiration_date: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.active} onCheckedChange={v => setForm({ ...form, active: v })} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground">
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromoCodesManager;
