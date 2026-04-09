import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Minus, Plus, ShoppingCart, Zap, Shield, Package } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useCart } from '@/contexts/CartContext';

const PRICE_PER_HUGE = 0.15;

const QUICK_AMOUNTS = [5, 10, 25, 50, 100];

const ShopPage = () => {
  const [quantity, setQuantity] = useState(10);
  const { addItem } = useCart();
  const navigate = useNavigate();

  const total = (quantity * PRICE_PER_HUGE).toFixed(2);

  const handleAddToCart = () => {
    addItem({
      id: 'random-huges',
      name: 'Random Huges',
      slug: 'random-huges',
      price_usd: PRICE_PER_HUGE,
      image_url: null,
      stock_quantity: 9999,
    }, quantity);
    navigate('/cart');
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl font-black mb-4">
            Buy Random Huges
          </h1>
          <p className="text-muted-foreground text-lg mb-10">
            Each Huge is randomly selected from our inventory and delivered manually in Roblox.
            You don't choose which Huge you get — that's part of the fun!
          </p>

          {/* Price Card */}
          <div className="bg-card border border-primary/30 rounded-2xl p-8 glow-primary mb-8">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Package className="h-6 w-6 text-primary" />
              <span className="font-display text-xl font-bold">Random Huge</span>
            </div>

            <div className="text-5xl font-display font-black text-primary mb-2">
              $0.15
            </div>
            <p className="text-sm text-muted-foreground mb-8">per Huge</p>

            {/* Quantity Selector */}
            <div className="mb-6">
              <p className="text-sm font-semibold mb-3">How many?</p>
              <div className="flex items-center justify-center gap-4 mb-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-xl"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <div className="w-24 text-center">
                  <input
                    type="number"
                    min={1}
                    max={9999}
                    value={quantity}
                    onChange={e => setQuantity(Math.max(1, Math.min(9999, parseInt(e.target.value) || 1)))}
                    className="w-full text-center text-3xl font-display font-bold bg-transparent border-b-2 border-primary/50 focus:border-primary outline-none"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-xl"
                  onClick={() => setQuantity(Math.min(9999, quantity + 1))}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>

              {/* Quick amounts */}
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_AMOUNTS.map(amt => (
                  <Button
                    key={amt}
                    variant={quantity === amt ? 'default' : 'outline'}
                    size="sm"
                    className={quantity === amt ? 'gradient-primary text-primary-foreground' : ''}
                    onClick={() => setQuantity(amt)}
                  >
                    {amt}x
                  </Button>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-border pt-6 mb-6">
              <div className="flex justify-between items-center text-lg">
                <span className="text-muted-foreground">{quantity}x Random Huges</span>
                <span className="font-display font-bold text-2xl">${total}</span>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full gradient-primary text-primary-foreground glow-primary text-lg h-14"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart — ${total}
            </Button>
          </div>

          {/* Trust Points */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border">
              <Zap className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-semibold">Fast Delivery</p>
                <p className="text-xs text-muted-foreground">Delivered in Roblox manually</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border">
              <Shield className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-semibold">100% Legit</p>
                <p className="text-xs text-muted-foreground">All Huges are legitimate items</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border">
              <Package className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-semibold">Random Selection</p>
                <p className="text-xs text-muted-foreground">Get a surprise mix of Huges</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ShopPage;
