import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Minus, Plus, ShoppingCart, Zap, Shield, Package, Sparkles, Star, Gem } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import Reveal from '@/components/Reveal';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { BRAND, getHugeUnitPrice, getHugeSubtotal } from '@/config/brand';

const HUGE_QUICK_AMOUNTS = [5, 10, 25, 50, 100, 250];

/** Briefly toggles a key when value changes — used to retrigger price-pop animation */
function usePopKey(value: number) {
  const [key, setKey] = useState(0);
  useEffect(() => { setKey(k => k + 1); }, [value]);
  return key;
}

const ShopPage = () => {
  const [hugeQty, setHugeQty] = useState(10);
  const [titanicQty, setTitanicQty] = useState(1);
  const [gemsQty, setGemsQty] = useState(1);
  const { addItem } = useCart();
  const navigate = useNavigate();

  const { data: products } = useQuery({
    queryKey: ['shop-products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').eq('active', true);
      return data ?? [];
    },
  });

  const hugeProduct = products?.find(p => (p as any).product_type === 'random_huge_bundle');
  const titanicProduct = products?.find(p => (p as any).product_type === 'random_titanic_bundle');
  const gemsProduct = products?.find(p => (p as any).product_type === 'gems_bundle');

  const hugeUnitPrice = getHugeUnitPrice(hugeQty);
  const hugeTotal = getHugeSubtotal(hugeQty).toFixed(2);
  const isBulk = hugeQty >= BRAND.bulkThreshold;
  const remaining = BRAND.bulkThreshold - hugeQty;

  const titanicUnitPrice = BRAND.titanicPrice;
  const titanicTotal = (titanicQty * titanicUnitPrice).toFixed(2);

  const gemsUnitPrice = BRAND.gemsPrice;
  const gemsTotal = (gemsQty * gemsUnitPrice).toFixed(2);

  const handleAddHuges = () => {
    addItem({
      id: hugeProduct?.id || 'random-huges',
      name: 'Random Huges',
      slug: 'random-huges',
      product_type: 'random_huge_bundle',
      price_usd: hugeUnitPrice,
      image_url: null,
      stock_quantity: 9999,
    }, hugeQty);
    navigate('/cart');
  };

  const handleAddTitanic = () => {
    addItem({
      id: titanicProduct?.id || 'random-titanic-pet',
      name: 'Random Titanic Pet',
      slug: 'random-titanic-pet',
      product_type: 'random_titanic_bundle',
      price_usd: titanicUnitPrice,
      image_url: null,
      stock_quantity: 9999,
    }, titanicQty);
    navigate('/cart');
  };

  const handleAddGems = () => {
    addItem({
      id: gemsProduct?.id || '1b-gems',
      name: '1B Gems',
      slug: '1b-gems',
      product_type: 'gems_bundle',
      price_usd: gemsUnitPrice,
      image_url: null,
      stock_quantity: 9999,
    }, gemsQty);
    navigate('/cart');
  };

  const hugePopKey = usePopKey(hugeQty);
  const titanicPopKey = usePopKey(titanicQty);
  const gemsPopKey = usePopKey(gemsQty);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-10">
            <h1 className="font-display text-4xl md:text-5xl font-black mb-4">PS99Loot Shop</h1>
            <p className="text-muted-foreground text-lg">
              Buy Random Huges, Titanic Pets, and Gems — delivered manually in Roblox.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* ── Random Huges Card ── */}
            <div className="bg-card border border-primary/30 rounded-2xl p-6 glow-primary relative overflow-hidden">
              {isBulk && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent animate-pulse" />
                </div>
              )}

              <div className="flex items-center justify-center gap-2 mb-4">
                <Package className="h-6 w-6 text-primary" />
                <span className="font-display text-xl font-bold">Random Huges</span>
              </div>

              <div className="text-center">
                <div className={`text-4xl font-display font-black mb-1 transition-all duration-500 ${isBulk ? 'text-success' : 'text-primary'}`}>
                  ${hugeUnitPrice.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground mb-2">per Huge</p>
                {isBulk && (
                  <div className="inline-flex items-center gap-1 bg-success/20 text-success px-3 py-1 rounded-full text-sm font-semibold animate-scale-in mb-3">
                    <Sparkles className="h-4 w-4" />
                    {BRAND.bulkDiscountPercent}% Bulk Discount!
                  </div>
                )}
                {!isBulk && remaining > 0 && (
                  <p className="text-sm text-primary font-medium mb-3">
                    🔥 {remaining} more for {BRAND.bulkDiscountPercent}% discount
                  </p>
                )}
              </div>

              <div className="mb-4">
                <p className="text-sm font-semibold mb-2 text-center">How many?</p>
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => setHugeQty(Math.max(1, hugeQty - 1))}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <input
                    type="number" min={1} max={9999} value={hugeQty}
                    onChange={e => setHugeQty(Math.max(1, Math.min(9999, parseInt(e.target.value) || 1)))}
                    className="w-20 text-center text-2xl font-display font-bold bg-transparent border-b-2 border-primary/50 focus:border-primary outline-none"
                  />
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => setHugeQty(Math.min(9999, hugeQty + 1))}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {HUGE_QUICK_AMOUNTS.map(amt => (
                    <Button key={amt} variant={hugeQty === amt ? 'default' : 'outline'} size="sm"
                      className={`${hugeQty === amt ? 'gradient-primary text-primary-foreground' : ''} ${amt >= BRAND.bulkThreshold ? 'border-success/50 text-success' : ''}`}
                      onClick={() => setHugeQty(amt)}
                    >
                      {amt}x{amt >= BRAND.bulkThreshold && <span className="ml-1 text-xs">💰</span>}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">{hugeQty}× {hugeQty === 1 ? 'Random Huge' : 'Random Huges'}</span>
                  <span className="font-display font-bold text-xl">${hugeTotal}</span>
                </div>
                {isBulk && (
                  <p className="text-xs text-success mt-1 text-right">
                    You save ${(hugeQty * (BRAND.priceStandard - BRAND.priceBulk)).toFixed(2)}!
                  </p>
                )}
              </div>

              <Button size="lg" className="w-full gradient-primary text-primary-foreground glow-primary" onClick={handleAddHuges}>
                <ShoppingCart className="mr-2 h-5 w-5" /> Add — ${hugeTotal}
              </Button>
            </div>

            {/* ── Random Titanic Pet Card ── */}
            <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Star className="h-6 w-6 text-primary" />
                <span className="font-display text-xl font-bold">Random Titanic Pet</span>
              </div>

              <div className="text-center">
                <div className="text-4xl font-display font-black text-primary mb-1">
                  ${titanicUnitPrice.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground mb-4">per Titanic Pet</p>
              </div>

              <div className="mb-4">
                <p className="text-sm font-semibold mb-2 text-center">How many?</p>
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => setTitanicQty(Math.max(1, titanicQty - 1))}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <input
                    type="number" min={1} max={9999} value={titanicQty}
                    onChange={e => setTitanicQty(Math.max(1, Math.min(9999, parseInt(e.target.value) || 1)))}
                    className="w-20 text-center text-2xl font-display font-bold bg-transparent border-b-2 border-primary/50 focus:border-primary outline-none"
                  />
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => setTitanicQty(Math.min(9999, titanicQty + 1))}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="border-t border-border pt-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">{titanicQty}× {titanicQty === 1 ? 'Random Titanic Pet' : 'Random Titanic Pets'}</span>
                  <span className="font-display font-bold text-xl">${titanicTotal}</span>
                </div>
              </div>

              <Button size="lg" className="w-full gradient-primary text-primary-foreground glow-primary" onClick={handleAddTitanic}>
                <ShoppingCart className="mr-2 h-5 w-5" /> Add — ${titanicTotal}
              </Button>
            </div>

            {/* ── 1B Gems Card ── */}
            <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Gem className="h-6 w-6 text-primary" />
                <span className="font-display text-xl font-bold">1B Gems</span>
              </div>

              <div className="text-center">
                <div className="text-4xl font-display font-black text-primary mb-1">
                  ${gemsUnitPrice.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground mb-4">per 1 Billion Gems</p>
              </div>

              <div className="mb-4">
                <p className="text-sm font-semibold mb-2 text-center">How many?</p>
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => setGemsQty(Math.max(1, gemsQty - 1))}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <input
                    type="number" min={1} max={9999} value={gemsQty}
                    onChange={e => setGemsQty(Math.max(1, Math.min(9999, parseInt(e.target.value) || 1)))}
                    className="w-20 text-center text-2xl font-display font-bold bg-transparent border-b-2 border-primary/50 focus:border-primary outline-none"
                  />
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => setGemsQty(Math.min(9999, gemsQty + 1))}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="border-t border-border pt-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">{gemsQty}× 1B Gems</span>
                  <span className="font-display font-bold text-xl">${gemsTotal}</span>
                </div>
              </div>

              <Button size="lg" className="w-full gradient-primary text-primary-foreground glow-primary" onClick={handleAddGems}>
                <ShoppingCart className="mr-2 h-5 w-5" /> Add — ${gemsTotal}
              </Button>
            </div>
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
                <p className="text-xs text-muted-foreground">All items are legitimate</p>
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
