import { ReactNode } from 'react';
import { useReveal, revealClass } from '@/hooks/useReveal';
import { cn } from '@/lib/utils';

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: 'div' | 'section' | 'article' | 'li';
}

const Reveal = ({ children, className, delay = 0, as: Tag = 'div' }: RevealProps) => {
  const { ref, revealed } = useReveal<HTMLDivElement>();
  const style = delay ? { transitionDelay: `${delay}ms` } : undefined;
  return (
    // @ts-expect-error – dynamic tag
    <Tag ref={ref} style={style} className={cn(revealClass(revealed), className)}>
      {children}
    </Tag>
  );
};

export default Reveal;
