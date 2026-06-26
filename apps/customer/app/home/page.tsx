"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QrCode, Store } from 'lucide-react';
import { supabase } from '@/utils/supabase';

type Shop = {
  id: string;
  name: string;
  category: string;
  visits_required: number;
};

type JoinedShop = {
  shop_id: string;
  total_visits: number;
  shop: Shop;
};

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<{name: string} | null>(null);
  const [shops, setShops] = useState<JoinedShop[]>([]);
  const [totalScratchCards, setTotalScratchCards] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Setting mock user for development
        setUser({ name: 'Rahul' });
      } else {
        const { data } = await supabase.from('users').select('name').eq('id', session.user.id).single();
        setUser(data);
      }
    };

    fetchUser();
    
    // Mock data for Phase 2 UI development
    setShops([
      {
        shop_id: '1',
        total_visits: 3,
        shop: { id: '1', name: 'Mama Juice Bar', category: 'juice_shop', visits_required: 5 }
      },
      {
        shop_id: '2',
        total_visits: 5,
        shop: { id: '2', name: 'Cafe Coffee Day', category: 'cafe', visits_required: 5 }
      }
    ]);
    setTotalScratchCards(2);
  }, [router]);

  return (
    <div className="min-h-screen pb-20 bg-background text-foreground">
      <div className="flex justify-between items-center p-6 pt-12">
        <h1 className="text-2xl font-bold">Hey {user?.name || 'there'}!</h1>
        <Link href="/scan" className="bg-primary/20 p-3 rounded-full text-primary hover:bg-primary/30 transition">
          <QrCode size={24} />
        </Link>
      </div>

      <div className="px-6 flex gap-4 mb-8">
        <div className="flex-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-2xl p-4 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-primary">{shops.length}</span>
          <span className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Shops Joined</span>
        </div>
        <div className="flex-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-2xl p-4 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-warning">{totalScratchCards}</span>
          <span className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Rewards Earned</span>
        </div>
      </div>

      <div className="px-6 space-y-4">
        <h2 className="text-xl font-bold mb-4">Your Places</h2>
        
        {shops.map((item) => (
          <Link key={item.shop_id} href={`/shop/${item.shop_id}`} className="block">
            <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-2xl p-4 flex items-center gap-4 hover:bg-[rgba(255,255,255,0.08)] transition">
              <div className="bg-gray-800 p-4 rounded-xl">
                <Store size={24} className="text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{item.shop.name}</h3>
                <p className="text-sm text-gray-400 capitalize">{item.shop.category.replace('_', ' ')}</p>
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300">
                      {item.shop.visits_required - (item.total_visits % item.shop.visits_required)} visits to reward
                    </span>
                    <span className="font-bold text-primary">{item.total_visits % item.shop.visits_required}/{item.shop.visits_required}</span>
                  </div>
                  <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${((item.total_visits % item.shop.visits_required) / item.shop.visits_required) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}

        <Link href="/scan" className="block mt-6">
          <div className="border-2 border-dashed border-[rgba(255,255,255,0.2)] rounded-2xl p-6 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-white hover:border-primary transition">
            <QrCode size={32} className="mb-2" />
            <h3 className="font-bold">Scan new shop QR</h3>
            <p className="text-sm text-center px-4">Add a new place to earn rewards</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
