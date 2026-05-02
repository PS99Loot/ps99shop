import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Search, Shield, Zap, MessageCircle, Bitcoin, Tag, ArrowRight } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import Reveal from '@/components/Reveal';
import RecentPurchases, { OrdersTodayBadge } from '@/components/store/RecentPurchases';
import Reviews from '@/components/store/Reviews';
import { BRAND } from '@/config/brand';

const TRUST_ITEMS = [
  { icon: Shield, title: 'Secure Crypto Payments', desc: 'BTC, ETH, LTC, USDT — fully encrypted' },
  { icon: Zap, title: 'Fast Delivery', desc: 'Most orders delivered in minutes' },
  { icon: MessageCircle, title: 'Live Support', desc: 'Real humans, ready to help' },
  { icon: Bitcoin, title: '4 Cryptos Accepted', desc: 'Pay your way, no fiat needed' },
  { icon: Tag, title: 'No Order Minimum', desc: 'Buy 1 huge or 1,000 — your call' },
];

const STEPS = [
  { num: '01', title: 'Pick Quantity', desc: 'Choose how many huges you want' },
  { num: '02', title: 'Pay With Crypto', desc: 'Send payment in your preferred coin' },
  { num: '03', title: 'Auto-Confirmed', desc: 'Our system detects payment instantly' },
  { num: '04', title: 'In-Game Delivery', desc: 'Contact support to claim in Roblox' },
];

const Index = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(217_91%_60%/0.15),transparent_60%)]" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <Reveal>
            <div className="flex justify-center mb-5">
              <OrdersTodayBadge />
            </div>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="font-display text-4xl md:text-6xl font-black mb-5 leading-tight">
              Pet Simulator 99 Huges
              <br />
              <span className="text-gradient">from $0.10 each</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-3">
              Fast delivery · Trusted by players · Secure crypto checkout
            </p>
          </Reveal>
          <Reveal delay={220}>
            <p className="text-sm text-primary font-semibold mb-8">
              🔥 Buy 100+ and pay only $0.10 each — save {BRAND.bulkDiscountPercent}%
            </p>
          </Reveal>
          <Reveal delay={280}>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <Link to="/shop">
                <Button size="lg" className="gradient-primary text-primary-foreground font-semibold glow-primary px-8 hover-lift btn-press group">
                  <ShoppingCart className="mr-2 h-5 w-5" /> Buy Now
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/track">
                <Button size="lg" variant="outline" className="border-border hover:border-primary/50 px-8 btn-press">
                  <Search className="mr-2 h-5 w-5" /> Track Order
                </Button>
              </Link>
            </div>
          </Reveal>
          <Reveal delay={360}>
            <div className="flex justify-center">
              <RecentPurchases />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-y border-border bg-card/50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {TRUST_ITEMS.map((item, i) => (
              <Reveal key={item.title} delay={i * 60} className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews near top */}
      <Reviews />

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <Reveal className="max-w-lg mx-auto bg-card border border-primary/30 rounded-2xl p-8 hover-lift">
            <h2 className="font-display text-3xl font-bold mb-2">$0.15 per Huge</h2>
            <p className="text-muted-foreground mb-2">Choose your quantity and get random Huges delivered in Roblox.</p>
            <p className="text-sm text-primary font-medium mb-6">100+ Huges → only $0.10 each</p>
            <Link to="/shop">
              <Button size="lg" className="gradient-primary text-primary-foreground glow-primary px-10 hover-lift btn-press">
                <ShoppingCart className="mr-2 h-5 w-5" /> Shop Now
              </Button>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-card/30">
        <div className="container mx-auto px-4">
          <Reveal><h2 className="font-display text-2xl font-bold text-center mb-12">How It Works</h2></Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <Reveal key={s.num} delay={i * 100} className="text-center">
                <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4 text-primary-foreground font-display font-bold text-lg">
                  {s.num}
                </div>
                <h3 className="font-semibold mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
