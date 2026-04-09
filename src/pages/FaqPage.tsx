import Layout from '@/components/layout/Layout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const FAQS = [
  { q: 'How does delivery work?', a: 'After your crypto payment is confirmed, an order chat opens. Share your Roblox username and we\'ll join your game to deliver your Huges manually. It\'s safe, personal, and fast.' },
  { q: 'What cryptocurrencies do you accept?', a: 'We accept Bitcoin (BTC), Ethereum (ETH), Litecoin (LTC), Solana (SOL), and USDT. More may be added in the future.' },
  { q: 'How long does delivery take?', a: 'Most deliveries are completed within 15-30 minutes after payment confirmation. During busy periods it may take slightly longer.' },
  { q: 'What if I sent the wrong amount?', a: 'If you underpay, your order may be placed on hold. If you overpay, we\'ll credit the difference or discuss via order chat. Always send the exact amount shown.' },
  { q: 'Can I get a refund?', a: 'Refunds are handled on a case-by-case basis. If we cannot deliver your item, you\'ll be refunded. Open a dispute through your order chat.' },
  { q: 'Do I need an account?', a: 'No! Guest checkout is supported. You\'ll receive an order ID and access code to track your order. Creating an account lets you view order history more easily.' },
  { q: 'Is this safe?', a: 'Yes. We deliver manually in-game which means your account is never at risk. Payments are handled via blockchain which provides transparency and security.' },
  { q: 'What if my payment expires?', a: 'Payment windows are typically 30 minutes. If your payment expires, you\'ll need to create a new order. No funds are lost unless sent after expiry.' },
  { q: 'Can I buy multiple Huges at once?', a: 'Absolutely! Add as many items as you want to your cart. They\'ll all be delivered in one session.' },
  { q: 'What network should I use for USDT?', a: 'We accept USDT on the ERC-20 network. Sending on the wrong network may result in lost funds.' },
];

const FaqPage = () => (
  <Layout>
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <h1 className="font-display text-3xl font-bold mb-2 text-center">Frequently Asked Questions</h1>
      <p className="text-muted-foreground text-center mb-8">Everything you need to know about buying Huges from PS99Shop.</p>
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
