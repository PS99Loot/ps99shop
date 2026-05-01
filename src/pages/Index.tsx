import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Search, Shield, Zap, MessageCircle, Bitcoin, Tag } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { BRAND } from '@/config/brand';

const TRUST_ITEMS = [
  { icon: Shield, title: 'Manual Safe Delivery', desc: 'Every item delivered personally in Roblox' },
  { icon: Zap, title: 'Automated Payment Detection', desc: 'Crypto payments confirmed automatically' },
  { icon: MessageCircle, title: 'Live Support Chat', desc: 'Reach our team anytime via the chat widget' },
  { icon: Bitcoin, title: 'Crypto Accepted', desc: 'BTC, ETH, LTC, USDT supported' },
  { icon: Tag, title: 'No Order Minimum', desc: 'Buy as few or as many as you want' },
];

const STEPS = [
  { num: '01', title: 'Choose Your Quantity', desc: 'Pick how many Random Huges you want' },
  { num: '02', title: 'Pay with Crypto', desc: 'Select your cryptocurrency and send payment' },
  { num: '03', title: 'Payment Confirmed', desc: 'Automated detection confirms your payment' },
  { num: '04', title: 'Get Delivery', desc: 'Join chat and receive your items in Roblox' },
];


const Index = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(217_91%_60%/0.15),transparent_60%)]" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="font-display text-4xl md:text-6xl font-black mb-6 leading-tight">
            Pet Simulator 99 Huges
            <br />
            <span className="text-gradient">for Only $0.15 Each</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
            The cheapest Random Huges in Pet Simulator 99. Choose your quantity, pay with crypto, and get random Huges delivered manually in Roblox.
          </p>
          <p className="text-sm text-primary font-semibold mb-8">
            🔥 Buy 100+ and pay only $0.10 each — save {BRAND.bulkDiscountPercent}%!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/shop">
              <Button size="lg" className="gradient-primary text-primary-foreground font-semibold glow-primary px-8">
                <ShoppingCart className="mr-2 h-5 w-5" /> Buy Random Huges
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
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

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-lg mx-auto bg-card border border-primary/30 rounded-2xl p-8 glow-primary">
            <h2 className="font-display text-3xl font-bold mb-2">$0.15 per Huge</h2>
            <p className="text-muted-foreground mb-2">Choose your quantity and get random Huges delivered to you in Roblox.</p>
            <p className="text-sm text-primary font-medium mb-6">100+ Huges → only $0.10 each!</p>
            <Link to="/shop">
              <Button size="lg" className="gradient-primary text-primary-foreground glow-primary px-10">
                <ShoppingCart className="mr-2 h-5 w-5" /> Buy Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

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

    </Layout>
  );
};

export default Index;
