"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Store, MapPin, Clock, Camera, MessageCircle, Globe, ChevronLeft, CheckCircle2 } from 'lucide-react';

export default function ShopProfile() {
  const { id } = useParams();
  const router = useRouter();
  const [shop, setShop] = useState<any>(null);
  const [stats, setStats] = useState({ total_visits: 3, reviews_submitted: false });

  useEffect(() => {
    // Mock fetch
    setShop({
      id,
      name: 'Mama Juice Bar',
      category: 'Juice Shop',
      address: '123 Main St, Indore',
      opening_hours: '10 AM - 10 PM',
      instagram: 'https://instagram.com/mamajuice',
      whatsapp: 'https://wa.me/919876543210',
      website: 'https://mamajuice.com',
      visits_required: 5
    });
  }, [id]);

  if (!shop) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen pb-20 bg-background text-foreground">
      {/* Cover & Header */}
      <div className="relative h-48 bg-gradient-to-r from-primary to-purple-900">
        <button onClick={() => router.back()} className="absolute top-12 left-4 p-2 bg-black/20 rounded-full text-white backdrop-blur">
          <ChevronLeft size={24} />
        </button>
      </div>

      <div className="px-6 relative -mt-16 text-center">
        <div className="w-32 h-32 mx-auto bg-gray-800 rounded-full border-4 border-background flex items-center justify-center text-primary shadow-xl">
          <Store size={48} />
        </div>
        <h1 className="text-2xl font-bold mt-4">{shop.name}</h1>
        <div className="inline-flex items-center gap-2 mt-2 bg-success/20 text-success px-3 py-1 rounded-full text-sm font-bold border border-success/30">
          <CheckCircle2 size={16} /> Joined
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 flex gap-3 mt-8">
        <div className="flex-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-2xl p-3 text-center">
          <div className="text-2xl font-bold text-primary">{stats.total_visits}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide">Visits</div>
        </div>
        <div className="flex-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-2xl p-3 text-center">
          <div className="text-2xl font-bold text-warning">1</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide">Rewards</div>
        </div>
        <div className="flex-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-2xl p-3 text-center">
          <div className="text-2xl font-bold text-gray-200">{shop.visits_required - (stats.total_visits % shop.visits_required)}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide">Visits Left</div>
        </div>
      </div>

      {/* Progress */}
      <div className="px-6 mt-8">
        <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-2xl p-5">
          <div className="flex justify-between text-sm mb-2">
            <span>Next Reward</span>
            <span className="font-bold text-primary">{stats.total_visits % shop.visits_required}/{shop.visits_required}</span>
          </div>
          <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden">
            <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${((stats.total_visits % shop.visits_required) / shop.visits_required)*100}%` }} />
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="px-6 mt-8 space-y-4">
        <div className="flex items-center gap-4 text-gray-300">
          <MapPin size={20} className="text-primary" />
          <span>{shop.address}</span>
        </div>
        <div className="flex items-center gap-4 text-gray-300">
          <Clock size={20} className="text-primary" />
          <span>{shop.opening_hours}</span>
        </div>
      </div>

      {/* Social Links */}
      <div className="px-6 mt-8 flex gap-4">
        {shop.instagram && (
          <a href={shop.instagram} target="_blank" rel="noopener noreferrer" className="bg-[#E1306C]/20 text-[#E1306C] p-3 rounded-xl flex-1 flex justify-center hover:bg-[#E1306C]/30 transition">
            <Camera size={24} />
          </a>
        )}
        {shop.whatsapp && (
          <a href={shop.whatsapp} target="_blank" rel="noopener noreferrer" className="bg-[#25D366]/20 text-[#25D366] p-3 rounded-xl flex-1 flex justify-center hover:bg-[#25D366]/30 transition">
            <MessageCircle size={24} />
          </a>
        )}
        {shop.website && (
          <a href={shop.website} target="_blank" rel="noopener noreferrer" className="bg-primary/20 text-primary p-3 rounded-xl flex-1 flex justify-center hover:bg-primary/30 transition">
            <Globe size={24} />
          </a>
        )}
      </div>

      {/* Review Button */}
      {stats.total_visits >= 1 && (
        <div className="px-6 mt-12">
          {stats.reviews_submitted ? (
            <button disabled className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-gray-500 font-bold py-4 rounded-xl">
              Review already submitted
            </button>
          ) : (
            <Link href={`/review/${shop.id}`} className="block w-full bg-white text-black text-center font-bold py-4 rounded-xl hover:bg-gray-200 transition shadow-lg">
              Rate us on Google
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
