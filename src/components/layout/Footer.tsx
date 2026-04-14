import { Link } from 'react-router-dom';
import { BRAND } from '@/config/brand';

const Footer = () => (
  <footer className="border-t border-border bg-card mt-20">
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h3 className="font-display text-lg font-bold text-gradient mb-4">{BRAND.name}</h3>
          <p className="text-sm text-muted-foreground">The cheapest Pet Simulator 99 Huges delivered fast. Crypto only. Manual safe delivery.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Shop</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <Link to="/shop" className="block hover:text-foreground transition-colors">Buy Huges</Link>
            <Link to="/cart" className="block hover:text-foreground transition-colors">Cart</Link>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Support</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <Link to="/track" className="block hover:text-foreground transition-colors">Track Order</Link>
            <Link to="/faq" className="block hover:text-foreground transition-colors">FAQ</Link>
            <Link to="/admin/login" className="block hover:text-foreground transition-colors">Admin Login</Link>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Legal</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <Link to="/terms" className="block hover:text-foreground transition-colors">Terms of Service</Link>
            <Link to="/refund" className="block hover:text-foreground transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>
      <div className="mt-10 pt-6 border-t border-border text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {BRAND.name}. All rights reserved. Not affiliated with Roblox or Pet Simulator 99.
      </div>
    </div>
  </footer>
);

export default Footer;
