import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BRAND } from '@/config/brand';

const AdminLoginPage = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin-password', {
        body: { password },
      });

      if (error || !data?.success) {
        toast.error(data?.error || 'Invalid password');
        return;
      }

      sessionStorage.setItem('admin_token', data.token);
      sessionStorage.setItem('admin_expiry', data.expiry.toString());
      toast.success('Access granted');
      navigate('/admin');
    } catch {
      toast.error('Failed to verify password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/shoplogo.png" alt={BRAND.name} className="h-12 w-12 mx-auto mb-3 object-contain" />
          <h1 className="font-display text-2xl font-bold text-gradient">{BRAND.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">Admin Panel</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4" /> Password
              </Label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-muted"
                placeholder="Enter admin password"
                required
              />
            </div>
            <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
              {loading ? 'Verifying...' : 'Access Admin Panel'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
