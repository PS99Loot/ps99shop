import Layout from '@/components/layout/Layout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BRAND } from '@/config/brand';

const FAQS = [
  { q: 'How does delivery work?', a: 'After your crypto payment is confirmed, contact us via the support chat in the bottom right of the site and include your Order ID. We\'ll join your Roblox game to deliver your items manually — safe, personal, and fast.' },
  { q: 'What cryptocurrencies do you accept?', a: 'We accept Bitcoin (BTC), Ethereum (ETH), Litecoin (LTC), and USDT (ERC-20). More may be added in the future.' },
  { q: 'How long does delivery take?', a: 'Most deliveries are completed within 15-30 minutes after you contact support with your Order ID. During busy periods it may take slightly longer.' },
  { q: 'What if I sent the wrong amount?', a: 'If you underpay, your order may be placed on hold. If you overpay, contact support via the chat with your Order ID and we\'ll sort it out. Always send the exact amount shown.' },
  { q: 'Can I get a refund?', a: 'Refunds are handled on a case-by-case basis. If we cannot deliver your item, you\'ll be refunded. Contact support via the chat with your Order ID to open a dispute.' },
  { q: 'Do I need an account?', a: 'No! Guest checkout is supported. You\'ll receive an order ID and access code to track your order. Creating an account lets you view order history more easily.' },
  { q: 'Is this safe?', a: 'Yes. We deliver manually in-game which means your account is never at risk. Payments are handled via blockchain which provides transparency and security.' },
  { q: 'What if my payment expires?', a: 'Payment windows are typically 30 minutes. If your payment expires, you\'ll need to create a new order. No funds are lost unless sent after expiry.' },
  { q: 'Can I buy multiple Huges at once?', a: 'Absolutely! Choose any quantity you want. They\'ll all be delivered in one session. Buy 100 or more to unlock our bulk discount!' },
  { q: 'What network should I use for USDT?', a: 'We accept USDT on the ERC-20 network. Sending on the wrong network may result in lost funds.' },
  { q: 'Are these high-tier or rare Huges?', a: 'The huges you receive are completely random and are mostly low-tier or common huges. This allows us to keep prices extremely low compared to the market.' },
  { q: 'Is there a bulk discount?', a: `Yes! Our standard price is $${BRAND.priceStandard.toFixed(2)} per Huge. If you buy ${BRAND.bulkThreshold} or more, the price drops to $${BRAND.priceBulk.toFixed(2)} each — that's a ${BRAND.bulkDiscountPercent}% discount!` },
];

const FaqPage = () => (
  <Layout>
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <h1 className="font-display text-3xl font-bold mb-2 text-center">Frequently Asked Questions</h1>
      <p className="text-muted-foreground text-center mb-8">Everything you need to know about buying Huges from {BRAND.name}.</p>
      <Accordion type="single" collapsible className="space-y-2">
        {FAQS.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="bg-card border border-border rounded-lg px-4">
            <AccordionTrigger className="text-sm font-semibold">{faq.q}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </Layout>
);

export default FaqPage;
