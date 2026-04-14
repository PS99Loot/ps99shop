import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Minus, Plus, ShoppingCart, Zap, Shield, Package, Sparkles } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { BRAND, getUnitPrice, getSubtotal } from '@/config/brand';

const QUICK_AMOUNTS = [5, 10, 25, 50, 100, 250];

const ShopPage = () => {
  const [quantity, setQuantity] = useState(10);
  const [flyingItem, setFlyingItem] = useState<{ x: number; y: number; targetX: number; targetY: number } | null>(null);
  const { addItem } = useCart();
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);

  const { data: products } = useQuery({
    queryKey: ['shop-products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').eq('active', true).order('price_usd', { ascending: true });
      return data ?? [];
    },
  });
  const total = getSubtotal(quantity).toFixed(2);
  const isBulk = quantity >= BRAND.bulkThreshold;
  const remaining = BRAND.bulkThreshold - quantity;

  const handleAddToCart = () => {
    const card = cardRef.current;
    const cartIcon = document.querySelector('[data-cart-icon]');

    if (card && cartIcon) {
      const cardRect = card.getBoundingClientRect();
      const cartRect = cartIcon.getBoundingClientRect();

      setFlyingItem({
        x: cardRect.left + cardRect.width / 2,
        y: cardRect.top + cardRect.height / 3,
        targetX: cartRect.left + cartRect.width / 2,
        targetY: cartRect.top + cartRect.height / 2,
      });

      setTimeout(() => {
        setFlyingItem(null);
        addItem({
          id: 'random-huges',
          name: 'Random Huges',
          slug: 'random-huges',
          price_usd: unitPrice,
          image_url: null,
          stock_quantity: 9999,
        }, quantity);
        navigate('/cart');
      }, 600);
    } else {
      addItem({
        id: 'random-huges',
        name: 'Random Huges',
        slug: 'random-huges',
        price_usd: unitPrice,
        image_url: null,
        stock_quantity: 9999,
      }, quantity);
      navigate('/cart');
    }
  };

  return (
    <Layout>
      {/* Flying animation */}
      {flyingItem && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: flyingItem.x,
            top: flyingItem.y,
            animation: 'flyToCart 0.6s ease-in forwards',
            '--target-x': `${flyingItem.targetX - flyingItem.x}px`,
            '--target-y': `${flyingItem.targetY - flyingItem.y}px`,
          } as React.CSSProperties}
        >
          <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center shadow-lg shadow-primary/50">
            <Package className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
      )}

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
          <div ref={cardRef} className="bg-card border border-primary/30 rounded-2xl p-8 glow-primary mb-8 relative overflow-hidden">
            {/* Bulk discount celebration */}
            {isBulk && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent animate-pulse" />
              </div>
            )}

            <div className="flex items-center justify-center gap-2 mb-6">
              <Package className="h-6 w-6 text-primary" />
              <span className="font-display text-xl font-bold">Random Huge</span>
            </div>

            {/* Price display */}
            <div className="relative">
              <div className={`text-5xl font-display font-black mb-2 transition-all duration-500 ${isBulk ? 'text-success' : 'text-primary'}`}>
                ${unitPrice.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground mb-2">per Huge</p>
              {isBulk && (
                <div className="inline-flex items-center gap-1 bg-success/20 text-success px-3 py-1 rounded-full text-sm font-semibold animate-scale-in mb-4">
                  <Sparkles className="h-4 w-4" />
                  {BRAND.bulkDiscountPercent}% Bulk Discount Applied!
                </div>
              )}
              {!isBulk && remaining > 0 && (
                <p className="text-sm text-primary font-medium mb-4">
                  🔥 {remaining} more for {BRAND.bulkDiscountPercent}% discount ($0.10/each)
                </p>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <p className="text-sm font-semibold mb-3">How many?</p>
              <div className="flex items-center justify-center gap-4 mb-4">
                <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
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
                <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl" onClick={() => setQuantity(Math.min(9999, quantity + 1))}>
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
                    className={`${quantity === amt ? 'gradient-primary text-primary-foreground' : ''} ${amt >= BRAND.bulkThreshold ? 'border-success/50 text-success' : ''}`}
                    onClick={() => setQuantity(amt)}
                  >
                    {amt}x
                    {amt >= BRAND.bulkThreshold && <span className="ml-1 text-xs">💰</span>}
                  </Button>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-border pt-6 mb-6">
              <div className="flex justify-between items-center text-lg">
                <span className="text-muted-foreground">{quantity}x Random Huges @ ${unitPrice.toFixed(2)}</span>
                <span className="font-display font-bold text-2xl">${total}</span>
              </div>
              {isBulk && (
                <p className="text-sm text-success mt-1 text-right">
                  You save ${(quantity * (BRAND.priceStandard - BRAND.priceBulk)).toFixed(2)}!
                </p>
              )}
            </div>

            <Button size="lg" className="w-full gradient-primary text-primary-foreground glow-primary text-lg h-14" onClick={handleAddToCart}>
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
                <p className="text-sm font-semibold">No Order Minimum</p>
                <p className="text-xs text-muted-foreground">Buy 1 or 1000 — up to you</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ShopPage;
