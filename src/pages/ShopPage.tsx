import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/store/ProductCard';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const ShopPage = () => {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');
  const [filter, setFilter] = useState('all');

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').eq('active', true);
      return data || [];
    },
  });

  const filtered = useMemo(() => {
    let list = products || [];
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    if (filter === 'instock') list = list.filter(p => p.stock_quantity - p.reserved_quantity > 0);
    if (filter === 'featured') list = list.filter(p => p.featured);
    if (sort === 'price_asc') list = [...list].sort((a, b) => Number(a.price_usd) - Number(b.price_usd));
    if (sort === 'price_desc') list = [...list].sort((a, b) => Number(b.price_usd) - Number(a.price_usd));
    if (sort === 'featured') list = [...list].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    return list;
  }, [products, search, sort, filter]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <h1 className="font-display text-3xl font-bold mb-8">Shop Huges</h1>
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search Huges..." className="pl-10 bg-card" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-48 bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48 bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="instock">In Stock Only</SelectItem>
              <SelectItem value="featured">Featured Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-card border border-border animate-pulse aspect-[3/4]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">No products found</p>
            <p className="text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ShopPage;
