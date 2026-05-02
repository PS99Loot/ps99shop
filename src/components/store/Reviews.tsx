import { Star } from 'lucide-react';
import Reveal from '@/components/Reveal';

const REVIEWS = [
  { user: 'AidenPlayz', text: 'Got my huges in minutes, legit 🔥. Will buy again for sure.', stars: 5 },
  { user: 'MythicMia', text: 'Best prices I have seen anywhere. Smooth checkout, fast delivery.', stars: 5 },
  { user: 'PixelPanda', text: 'Was nervous at first but the support team helped right away. 10/10.', stars: 5 },
  { user: 'SkyDragon7', text: 'Bought 250 huges, paid in BTC, delivered same day. Trusted.', stars: 5 },
  { user: 'TitanLover', text: 'Cheapest titanic pet I could find online. Real and legit.', stars: 5 },
  { user: 'GemQueen', text: 'Gems delivered in under 10 minutes. Couldn’t be happier.', stars: 5 },
];

const Stars = ({ n }: { n: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < n ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`} />
    ))}
  </div>
);

const Reviews = ({ compact = false }: { compact?: boolean }) => {
  const list = compact ? REVIEWS.slice(0, 3) : REVIEWS;
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <Reveal className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <Stars n={5} />
            <span className="text-sm font-semibold">4.9/5 from 1,200+ buyers</span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold">What players are saying</h2>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {list.map((r, i) => (
            <Reveal key={r.user} delay={i * 80}
              className="rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-300">
              <Stars n={r.stars} />
              <p className="text-sm mt-3 text-foreground/90">"{r.text}"</p>
              <p className="text-xs text-muted-foreground mt-3">— {r.user}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Reviews;
