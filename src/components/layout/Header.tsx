import { Link } from 'react-router-dom';
import { ShoppingCart, Menu, X, User, LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

const Header = () => {
  const { totalItems } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/shop', label: 'Shop' },
    { to: '/track', label: 'Track Order' },
    { to: '/faq', label: 'FAQ' },
  ];

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-xl font-bold text-gradient">PS99Shop</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link to="/admin">
              <Button variant="ghost" size="icon" className="text-warning">
                <Shield className="h-5 w-5" />
              </Button>
            </Link>
          )}
          {user ? (
            <Button variant="ghost" size="icon" onClick={() => signOut()}>
              <LogOut className="h-5 w-5" />
            </Button>
          ) : (
            <Link to="/login">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          )}
          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon" data-cart-icon>
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-4 space-y-3">
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} className="block text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileOpen(false)}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};

export default Header;
