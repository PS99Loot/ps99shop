import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SupportCTAProps {
  orderId?: string;
  className?: string;
}

/**
 * Triggers the Brevo Conversations widget. Falls back to instructing the user
 * to use the bottom-right chat if the SDK isn't ready yet.
 */
export const openSupportChat = () => {
  const w = window as any;
  try {
    if (typeof w.BrevoConversations === 'function') {
      w.BrevoConversations('openChat', true);
      return true;
    }
  } catch (e) {
    // ignore
  }
  return false;
};

const SupportCTA = ({ orderId, className }: SupportCTAProps) => {
  return (
    <div className={`bg-card border border-primary/40 rounded-lg p-5 space-y-3 ${className || ''}`}>
      <h3 className="font-display font-bold text-lg flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        Claim Your Order
      </h3>
      <p className="text-sm text-foreground">
        Please contact support to claim your order.
      </p>
      <p className="text-sm text-muted-foreground">
        Use the chat in the bottom right and include your Order ID
        {orderId ? <> <span className="font-mono font-bold text-primary">{orderId}</span></> : ''}.
      </p>
      <Button
        onClick={() => {
          const opened = openSupportChat();
          if (!opened) {
            // Fallback: gently scroll attention to the widget area
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          }
        }}
        className="w-full gradient-primary text-primary-foreground"
      >
        <MessageCircle className="mr-2 h-4 w-4" /> Contact Support
      </Button>
    </div>
  );
};

export default SupportCTA;
