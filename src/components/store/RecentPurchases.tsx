import { useEffect, useState } from 'react';
import { ShoppingBag, TrendingUp } from 'lucide-react';

const USERNAMES = [
  'PetHunter22', 'RobloxKing_91', 'HugeCollector', 'xX_Aiden_Xx',
  'SkyDragon7', 'NoobSlayer42', 'MythicMia', 'TitanLover',
  'GemQueen', 'PixelPanda', 'ZephyrPlayz', 'LunaCraft',
  'ShadowFox99', 'EmberWolf', 'BlazeRunner', 'StarChaser',
];
const ITEMS = [
  '50× Random Huges', '100× Random Huges', '1× Random Titanic Pet',
  '5× 1B Gems', '250× Random Huges', '2× Random Titanic Pets',
  '10× Random Huges', '3× 1B Gems',
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const RecentPurchases = () => {
  const [index, setIndex] = useState(0);
  const [feed, setFeed] = useState(() =>
    Array.from({ length: 6 }, () => ({
      user: pick(USERNAMES),
      item: pick(ITEMS),
      mins: Math.floor(Math.random() * 14) + 1,
    }))
  );

  useEffect(() => {
    const id = setInterval(() => {
      setFeed(prev => {
        const next = [...prev];
        next[index % next.length] = {
          user: pick(USERNAMES),
          item: pick(ITEMS),
          mins: Math.floor(Math.random() * 14) + 1,
        };
        return next;
      });
      setIndex(i => i + 1);
    }, 4000);
    return () => clearInterval(id);
  }, [index]);

  const current = feed[index % feed.length];

  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card/80 backdrop-blur px-4 py-2 text-sm shadow-sm">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
      </span>
      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
      <div key={index} className="animate-fade-in">
        <span className="font-semibold">{current.user}</span>
        <span className="text-muted-foreground"> bought </span>
        <span className="font-medium">{current.item}</span>
        <span className="text-muted-foreground"> · {current.mins}m ago</span>
      </div>
    </div>
  );
};

export const OrdersTodayBadge = () => {
  // Stable-ish realistic count: base on day-of-year
  const day = Math.floor((Date.now() / 86400000));
  const base = 38 + (day % 27);
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
      <TrendingUp className="h-3.5 w-3.5" />
      {base} orders delivered today
    </div>
  );
};

export default RecentPurchases;
