import Layout from '@/components/layout/Layout';
import { BRAND } from '@/config/brand';

const TermsPage = () => (
  <Layout>
    <div className="container mx-auto px-4 py-10 max-w-2xl prose prose-invert">
      <h1 className="font-display text-3xl font-bold mb-8">Terms of Service</h1>

      <h2 className="font-display text-xl font-bold mt-8 mb-4">1. Overview</h2>
      <p className="text-muted-foreground text-sm">{BRAND.name} is a marketplace for virtual items in Pet Simulator 99 (Roblox). By using our service, you agree to these terms. All sales involve virtual goods delivered manually in-game.</p>

      <h2 className="font-display text-xl font-bold mt-8 mb-4">2. Payments</h2>
      <p className="text-muted-foreground text-sm">We accept cryptocurrency payments only (BTC, ETH, LTC, USDT). Payments must be sent to the exact address and in the exact amount shown during checkout. Sending funds to the wrong address or on the wrong network may result in permanent loss of funds. {BRAND.name} is not responsible for user error in payment transactions.</p>

      <h2 className="font-display text-xl font-bold mt-8 mb-4">3. Delivery</h2>
      <p className="text-muted-foreground text-sm">All items are delivered manually in Roblox after payment confirmation. Delivery times vary but are typically completed within 30 minutes. Buyers must contact support via the on-site chat with their Order ID to claim delivery. You must provide a valid Roblox username to receive delivery.</p>

      <h2 className="font-display text-xl font-bold mt-8 mb-4">4. Refunds & Disputes</h2>
      <p className="text-muted-foreground text-sm">If we are unable to deliver your purchased items, a refund will be processed. Refund requests are handled on a case-by-case basis through the support chat. Due to the nature of cryptocurrency transactions, refunds may be issued in a different cryptocurrency or equivalent value.</p>

      <h2 className="font-display text-xl font-bold mt-8 mb-4">5. Disclaimer</h2>
      <p className="text-muted-foreground text-sm">{BRAND.name} is not affiliated with, endorsed by, or connected to Roblox Corporation or BIG Games (creators of Pet Simulator 99). Virtual item trading is done at your own risk. We do not guarantee the future value or availability of any items sold.</p>

      <h2 className="font-display text-xl font-bold mt-8 mb-4">6. Support</h2>
      <p className="text-muted-foreground text-sm">For questions or issues, use the support chat in the bottom right of the site and include your Order ID. We aim to resolve all disputes fairly and promptly.</p>
    </div>
  </Layout>
);

export default TermsPage;
