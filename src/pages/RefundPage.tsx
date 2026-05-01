import Layout from '@/components/layout/Layout';
import { BRAND } from '@/config/brand';

const RefundPage = () => (
  <Layout>
    <div className="container mx-auto px-4 py-10 max-w-2xl prose prose-invert">
      <h1 className="font-display text-3xl font-bold mb-8">Refund Policy</h1>

      <h2 className="font-display text-xl font-bold mt-8 mb-4">Eligibility</h2>
      <p className="text-muted-foreground text-sm">Refunds may be issued when {BRAND.name} is unable to deliver the purchased virtual items, or if there is a confirmed error on our part. Each refund request is reviewed individually.</p>

      <h2 className="font-display text-xl font-bold mt-8 mb-4">How to Request a Refund</h2>
      <p className="text-muted-foreground text-sm">To request a refund, contact support via the chat in the bottom right of the site and include your Order ID and a description of the issue. Our team will review your case and respond within 24 hours.</p>

      <h2 className="font-display text-xl font-bold mt-8 mb-4">Refund Method</h2>
      <p className="text-muted-foreground text-sm">Due to the nature of cryptocurrency transactions, refunds may be processed in the original cryptocurrency or an equivalent value in another supported currency. Refund amounts are calculated at the exchange rate at the time of the refund, not the original purchase.</p>

      <h2 className="font-display text-xl font-bold mt-8 mb-4">Non-Refundable Situations</h2>
      <p className="text-muted-foreground text-sm">Refunds will not be issued for: items successfully delivered, buyer providing incorrect Roblox username, buyer not being available for delivery after multiple attempts, or payment sent to the wrong address or on the wrong network.</p>

      <h2 className="font-display text-xl font-bold mt-8 mb-4">Processing Time</h2>
      <p className="text-muted-foreground text-sm">Approved refunds are typically processed within 48 hours. Blockchain transaction times may add additional delay depending on network conditions.</p>
    </div>
  </Layout>
);

export default RefundPage;
