import { Badge } from '@/components/ui/badge';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  awaiting_payment: { label: 'Awaiting Payment', className: 'bg-warning/20 text-warning border-warning/30' },
  payment_detected: { label: 'Payment Detected', className: 'bg-primary/20 text-primary border-primary/30' },
  confirming: { label: 'Confirming', className: 'bg-primary/20 text-primary border-primary/30' },
  paid: { label: 'Paid', className: 'bg-success/20 text-success border-success/30' },
  queued_for_delivery: { label: 'Queued', className: 'bg-secondary/20 text-secondary border-secondary/30' },
  in_delivery: { label: 'In Delivery', className: 'bg-secondary/20 text-secondary border-secondary/30' },
  completed: { label: 'Completed', className: 'bg-success/20 text-success border-success/30' },
  disputed: { label: 'Disputed', className: 'bg-destructive/20 text-destructive border-destructive/30' },
  expired: { label: 'Expired', className: 'bg-muted text-muted-foreground border-border' },
  cancelled: { label: 'Cancelled', className: 'bg-muted text-muted-foreground border-border' },
  refunded: { label: 'Refunded', className: 'bg-muted text-muted-foreground border-border' },
  // payment statuses
  pending: { label: 'Pending', className: 'bg-warning/20 text-warning border-warning/30' },
  detected: { label: 'Detected', className: 'bg-primary/20 text-primary border-primary/30' },
  confirmed: { label: 'Confirmed', className: 'bg-success/20 text-success border-success/30' },
  underpaid: { label: 'Underpaid', className: 'bg-destructive/20 text-destructive border-destructive/30' },
  overpaid: { label: 'Overpaid', className: 'bg-warning/20 text-warning border-warning/30' },
  failed: { label: 'Failed', className: 'bg-destructive/20 text-destructive border-destructive/30' },
};

const StatusBadge = ({ status }: { status: string }) => {
  const config = STATUS_CONFIG[status] || { label: status, className: 'bg-muted text-muted-foreground' };
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
};

export default StatusBadge;
