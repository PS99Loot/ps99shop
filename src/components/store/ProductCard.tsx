import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import type { Tables } from '@/integrations/supabase/types';

const ProductCard = ({ product }: { product: Tables<'products'> }) => {
  const { addItem } = useCart();
  const inStock = product.stock_quantity - product.reserved_quantity > 0;

  return (
    <div className="group rounded-lg border border-border bg-card overflow-hidden hover:border-primary/50 transition-all duration-300 hover:glow-primary">
      <Link to={`/product/${product.slug}`}>
        <div className="aspect-square bg-muted flex items-center justify-center p-6 relative overflow-hidden">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" />
          ) : (
            <div className="w-20 h-20 rounded-full gradient-primary opacity-50" />
          )}
          {product.badge && (
            <Badge className="absolute top-3 right-3 gradient-primary border-0 text-primary-foreground text-xs">{product.badge}</Badge>
          )}
          {!inStock && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
              <span className="font-display text-sm text-destructive font-bold">OUT OF STOCK</span>
            </div>
          )}
        </div>
      </Link>
      <div className="p-4 space-y-2">
        <Link to={`/product/${product.slug}`}>
          <h3 className="font-display text-sm font-semibold truncate hover:text-primary transition-colors">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">${Number(product.price_usd).toFixed(2)}</span>
          {product.compare_at_price && (
            <span className="text-sm text-muted-foreground line-through">${Number(product.compare_at_price).toFixed(2)}</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-xs ${inStock ? 'text-success' : 'text-destructive'}`}>
            {inStock ? `${product.stock_quantity - product.reserved_quantity} in stock` : 'Out of stock'}
          </span>
          <Button
            size="sm"
            disabled={!inStock}
            className="gradient-primary text-primary-foreground hover:opacity-90"
            onClick={() => addItem({
              id: product.id,
              name: product.name,
              slug: product.slug,
              price_usd: Number(product.price_usd),
              image_url: product.image_url,
              stock_quantity: product.stock_quantity - product.reserved_quantity,
            })}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
