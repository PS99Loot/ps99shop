import { Star } from 'lucide-react';

const TRUSTPILOT_URL = 'https://www.trustpilot.com/review/ps99loot.com';

interface TrustpilotProps {
  variant?: 'inline' | 'card';
  className?: string;
}

const Stars = () => (
  <div className="flex gap-0.5" aria-label="5 out of 5 stars">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className="h-4 w-4 fill-[#00b67a] text-[#00b67a]" />
    ))}
  </div>
);

const Trustpilot = ({ variant = 'card', className = '' }: TrustpilotProps) => {
  if (variant === 'inline') {
    return (
      <a
        href={TRUSTPILOT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 text-sm hover:opacity-80 transition-opacity ${className}`}
      >
        <Stars />
        <span className="font-semibold">Rated on Trustpilot</span>
      </a>
    );
  }

  return (
    <a
      href={TRUSTPILOT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 hover:border-foreground/30 transition-colors ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold text-[#00b67a]">★ Trustpilot</span>
      </div>
      <div className="h-5 w-px bg-border" />
      <div className="flex items-center gap-2">
        <Stars />
        <span className="text-sm text-muted-foreground">Check our reviews</span>
      </div>
    </a>
  );
};

export default Trustpilot;
