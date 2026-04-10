import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ShoppingCart, Sparkles } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useCart } from '@/contexts/CartContext';
import { BRAND, getUnitPrice } from '@/config/brand';

const CartPage = () => {
  const { items, updateQuantity, removeItem, subtotal, totalItems } = useCart();

  const unitPrice = getUnitPrice(totalItems);
  const isBulk = totalItems >= BRAND.bulkThreshold;
  const remaining = BRAND.bulkThreshold - totalItems;

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Your Cart is Empty</h1>
          <p className="text-muted-foreground mb-6">Head to the shop to buy some Random Huges!</p>
          <Link to="/shop"><Button className="gradient-primary text-primary-foreground">Buy Random Huges</Button></Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <h1 className="font-display text-3xl font-bold mb-8">Your Cart</h1>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{item.name}</p>
                  <span className="text-sm text-muted-foreground">${unitPrice.toFixed(2)} each</span>
                </div>
                <div className="flex items-center border border-border rounded-lg">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                  <span className="w-10 text-center text-sm">{item.quantity}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                </div>
                <span className="font-semibold w-20 text-right">${(unitPrice * item.quantity).toFixed(2)}</span>
                <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
          <div className="bg-card border border-border rounded-lg p-6 h-fit space-y-4">
            <h2 className="font-display text-lg font-bold">Order Summary</h2>
            {items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.quantity}x {item.name}</span>
                <span>${(unitPrice * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="text-sm text-muted-foreground">
              Unit price: ${unitPrice.toFixed(2)} each
            </div>
            {isBulk && (
              <div className="flex items-center gap-1 text-sm text-success font-medium">
                <Sparkles className="h-4 w-4" />
                {BRAND.bulkDiscountPercent}% bulk discount applied!
              </div>
            )}
            {!isBulk && remaining > 0 && (
              <p className="text-sm text-primary">
                Add {remaining} more for {BRAND.bulkDiscountPercent}% off!
              </p>
            )}
            <div className="border-t border-border pt-4 flex justify-between font-bold"><span>Total</span><span>${subtotal.toFixed(2)}</span></div>
            {isBulk && (
              <p className="text-xs text-success text-right">
                Saving ${(totalItems * (BRAND.priceStandard - BRAND.priceBulk)).toFixed(2)}
              </p>
            )}
            <Link to="/checkout" className="block">
              <Button className="w-full gradient-primary text-primary-foreground glow-primary" size="lg">Proceed to Checkout</Button>
            </Link>
            <p className="text-xs text-muted-foreground text-center">Crypto payments only. Prices in USD.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CartPage;
