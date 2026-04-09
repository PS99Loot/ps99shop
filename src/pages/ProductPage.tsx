import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ShoppingCart, Minus, Plus, Shield, MessageCircle, Bitcoin, Clock } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import { toast } from 'sonner';

const ProductPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').eq('slug', slug!).single();
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) return <Layout><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div></Layout>;
  if (!product) return <Layout><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Product not found</div></Layout>;

  const available = product.stock_quantity - product.reserved_quantity;
  const inStock = available > 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="aspect-square rounded-lg bg-card border border-border flex items-center justify-center p-10">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-contain" />
            ) : (
              <div className="w-32 h-32 rounded-full gradient-primary opacity-40" />
            )}
          </div>
          <div className="space-y-6">
            <div>
              {product.badge && <Badge className="gradient-primary border-0 text-primary-foreground mb-2">{product.badge}</Badge>}
              <h1 className="font-display text-3xl font-bold">{product.name}</h1>
              <p className="text-muted-foreground mt-2">{product.description || 'A rare Huge pet from Pet Simulator 99.'}</p>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold">${Number(product.price_usd).toFixed(2)}</span>
              {product.compare_at_price && (
                <span className="text-lg text-muted-foreground line-through">${Number(product.compare_at_price).toFixed(2)}</span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className={inStock ? 'text-success' : 'text-destructive'}>{inStock ? `${available} in stock` : 'Out of stock'}</span>
              {product.estimated_delivery_minutes && (
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4" /> ~{product.estimated_delivery_minutes} min delivery
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-border rounded-lg">
                <Button variant="ghost" size="icon" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-4 w-4" /></Button>
                <span className="w-12 text-center font-semibold">{qty}</span>
                <Button variant="ghost" size="icon" onClick={() => setQty(Math.min(available, qty + 1))}><Plus className="h-4 w-4" /></Button>
              </div>
              <Button
                size="lg"
                disabled={!inStock}
                className="gradient-primary text-primary-foreground flex-1 glow-primary"
                onClick={() => {
                  addItem({ id: product.id, name: product.name, slug: product.slug, price_usd: Number(product.price_usd), image_url: product.image_url, stock_quantity: available }, qty);
                  toast.success(`Added ${qty}x ${product.name} to cart`);
                }}
              >
                <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
              </Button>
            </div>

            {/* Trust Box */}
            <div className="rounded-lg border border-border p-4 space-y-3 bg-card">
              <div className="flex items-center gap-2 text-sm"><Bitcoin className="h-4 w-4 text-primary" /> Crypto payments only</div>
              <div className="flex items-center gap-2 text-sm"><Shield className="h-4 w-4 text-primary" /> Manual safe delivery in Roblox</div>
              <div className="flex items-center gap-2 text-sm"><MessageCircle className="h-4 w-4 text-primary" /> Chat opens after payment is confirmed</div>
            </div>

            <Accordion type="single" collapsible>
              <AccordionItem value="delivery"><AccordionTrigger>How is delivery done?</AccordionTrigger><AccordionContent>After payment confirmation, an order chat opens. Share your Roblox username and we'll join your game to deliver the item manually.</AccordionContent></AccordionItem>
              <AccordionItem value="time"><AccordionTrigger>How long does delivery take?</AccordionTrigger><AccordionContent>Most deliveries are completed within {product.estimated_delivery_minutes || 30} minutes after payment confirmation.</AccordionContent></AccordionItem>
              <AccordionItem value="refund"><AccordionTrigger>What if something goes wrong?</AccordionTrigger><AccordionContent>Use the order chat to report any issues. We handle disputes fairly and promptly.</AccordionContent></AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductPage;
