import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Search, Shield, Zap, MessageCircle, Bitcoin, CheckCircle, ArrowRight } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/store/ProductCard';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const TRUST_ITEMS = [
  { icon: Shield, title: 'Manual Safe Delivery', desc: 'Every item delivered personally in Roblox' },
  { icon: Zap, title: 'Automated Payment Detection', desc: 'Crypto payments confirmed automatically' },
  { icon: MessageCircle, title: 'Live Order Support', desc: 'Chat opens after payment for coordination' },
  { icon: Bitcoin, title: 'Crypto Accepted', desc: 'BTC, ETH, LTC, SOL, USDT supported' },
];

const STEPS = [
  { num: '01', title: 'Choose a Huge', desc: 'Browse our collection of Pet Sim 99 Huges' },
  { num: '02', title: 'Pay with Crypto', desc: 'Select your cryptocurrency and send payment' },
  { num: '03', title: 'Payment Confirmed', desc: 'Automated detection confirms your payment' },
  { num: '04', title: 'Get Delivery', desc: 'Join chat and receive your items in Roblox' },
];

const MOCK_ACTIVITY = [
  { user: 'R***x_Player', item: 'Huge Hell Rock', time: '2 min ago' },
  { user: 'G***r_2024', item: 'Huge Gargoyle Dragon', time: '5 min ago' },
  { user: 'P***t_King', item: 'Huge Empyrean Dragon', time: '12 min ago' },
  { user: 'S***r_Pro99', item: 'Huge Cosmic Agony', time: '18 min ago' },
  { user: 'B***y_Master', item: 'Huge Storm Agony', time: '25 min ago' },
];

const Index = () => {
  const { data: featured } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').eq('active', true).eq('featured', true).limit(4);
      return data || [];
    },
  });

  return (
    <Layout>
      {/* Hero */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(217_91%_60%/0.15),transparent_60%)]" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="font-display text-4xl md:text-6xl font-black mb-6 leading-tight">
            Cheap Pet Sim 99 Huges
            <br />
            <span className="text-gradient">Delivered Fast</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            The world's cheapest Pet Simulator 99 marketplace. Pay with crypto, get your Huges delivered manually in Roblox. Fast, safe, and trusted.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/shop">
              <Button size="lg" className="gradient-primary text-primary-foreground font-semibold glow-primary px-8">
                <ShoppingCart className="mr-2 h-5 w-5" /> Shop Huges
              </Button>
            </Link>
            <Link to="/track">
              <Button size="lg" variant="outline" className="border-border hover:border-primary/50 px-8">
                <Search className="mr-2 h-5 w-5" /> Track Order
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-y border-border bg-card/50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TRUST_ITEMS.map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featured && featured.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-2xl font-bold">Featured Huges</h2>
              <Link to="/shop" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featured.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-16 bg-card/30">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STEPS.map((s) => (
              <div key={s.num} className="text-center">
                <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4 text-primary-foreground font-display font-bold text-lg">
                  {s.num}
                </div>
                <h3 className="font-semibold mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl font-bold text-center mb-8">Recent Deliveries</h2>
          <div className="max-w-lg mx-auto space-y-3">
            {MOCK_ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm"><span className="text-muted-foreground">{a.user}</span> received <span className="font-semibold">{a.item}</span></span>
                </div>
                <span className="text-xs text-muted-foreground">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
