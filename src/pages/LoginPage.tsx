import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const LoginPage = () => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
        toast.success('Account created! You can now sign in.');
      } else {
        await signIn(email, password);
        toast.success('Logged in successfully');
        navigate('/');
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-20 max-w-md">
        <div className="bg-card border border-border rounded-lg p-8">
          <h1 className="font-display text-2xl font-bold text-center mb-2">{isSignUp ? 'Create Account' : 'Sign In'}</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            {isSignUp ? 'Create an account to track orders easily' : 'Sign in to view your orders'}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-muted" required /></div>
            <div><Label>Password</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} className="bg-muted" required minLength={6} /></div>
            <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
              {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>
          <p className="text-sm text-center mt-4 text-muted-foreground">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary hover:underline">{isSignUp ? 'Sign In' : 'Sign Up'}</button>
          </p>
          <p className="text-xs text-center mt-4 text-muted-foreground">
            Guest checkout is available — no account needed to buy.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;
