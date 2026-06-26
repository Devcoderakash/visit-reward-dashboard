"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QrReader } from 'react-qr-reader';
import { CheckCircle2, Heart, Clock, Gift, X } from 'lucide-react';
import { supabase } from '@/utils/supabase';

type ScanResultState = 'scanning' | 'loading' | 'first_visit' | 'visit_recorded' | 'already_visited' | 'scratch_card_unlocked';

export default function Scan() {
  const router = useRouter();
  const [scanState, setScanState] = useState<ScanResultState>('scanning');
  const [shopName, setShopName] = useState('');
  const [visits, setVisits] = useState(0);
  const [scratchCardId, setScratchCardId] = useState('');

  const handleScan = async (result: any, error: any) => {
    if (!!result && scanState === 'scanning') {
      try {
        setScanState('loading');
        const url = new URL(result?.text);
        const shop_qr_id = url.searchParams.get('shop') || result?.text;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/signup');
          return;
        }

        const res = await fetch('/api/visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shop_qr_id, customer_id: session.user.id })
        });

        if (!res.ok) throw new Error("API Error");
        const data = await res.json();
        
        setShopName(data.shop.name);
        setVisits(data.visits);
        if (data.scratch_card_id) {
          setScratchCardId(data.scratch_card_id);
        }
        setScanState(data.status as ScanResultState);

        if (data.status === 'scratch_card_unlocked') {
          setTimeout(() => {
            router.push(`/scratch-card/${data.scratch_card_id}`);
          }, 2000);
        }

      } catch (err) {
        console.error('Invalid QR code or Error:', err);
        setScanState('scanning');
      }
    }
  };

  const Overlay = () => {
    if (scanState === 'scanning' || scanState === 'loading') return null;

    return (
      <div className="absolute inset-0 bg-background/95 z-50 flex flex-col items-center justify-center p-6">
        {scanState === 'first_visit' && (
          <div className="text-center space-y-4">
            <div className="inline-flex bg-success/20 p-4 rounded-full text-success mb-4">
              <CheckCircle2 size={64} />
            </div>
            <h2 className="text-3xl font-bold">Connected!</h2>
            <p className="text-xl text-gray-300">{shopName}</p>
            <div className="w-full max-w-xs mx-auto mt-8">
              <div className="flex justify-between text-sm mb-2">
                <span>Visit {visits}/5</span>
              </div>
              <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden">
                <div className="bg-success h-full rounded-full transition-all duration-1000" style={{ width: `${(visits/5)*100}%` }} />
              </div>
            </div>
          </div>
        )}

        {scanState === 'visit_recorded' && (
          <div className="text-center space-y-4">
            <div className="inline-flex bg-primary/20 p-4 rounded-full text-primary mb-4">
              <Heart size={64} fill="currentColor" />
            </div>
            <h2 className="text-3xl font-bold">Welcome back!</h2>
            <p className="text-xl text-gray-300">{shopName}</p>
            <div className="w-full max-w-xs mx-auto mt-8">
              <div className="flex justify-between text-sm mb-2">
                <span>Visit {visits}/5</span>
              </div>
              <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${(visits/5)*100}%` }} />
              </div>
            </div>
          </div>
        )}

        {scanState === 'already_visited' && (
          <div className="text-center space-y-4">
            <div className="inline-flex bg-warning/20 p-4 rounded-full text-warning mb-4">
              <Clock size={64} />
            </div>
            <h2 className="text-3xl font-bold">Aaj ki visit ho gayi!</h2>
            <p className="text-lg text-gray-300">You can only record one visit per day at {shopName}.</p>
            <p className="text-md text-gray-400 mt-2">Kal wapas aana to earn your next visit.</p>
          </div>
        )}

        {scanState === 'scratch_card_unlocked' && (
          <div className="text-center space-y-4">
            <div className="inline-flex bg-warning/20 p-4 rounded-full text-warning mb-4 animate-bounce">
              <Gift size={64} />
            </div>
            <h2 className="text-3xl font-bold text-warning">5 visits complete!</h2>
            <p className="text-xl text-gray-300">Unlocking your reward...</p>
          </div>
        )}

        {scanState !== 'scratch_card_unlocked' && (
          <button 
            onClick={() => router.push('/home')}
            className="mt-12 bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl font-bold transition"
          >
            Go to home
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black relative text-white">
      <div className="absolute top-0 left-0 w-full p-6 z-40 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <h1 className="text-xl font-bold">Scan Shop QR</h1>
        <button onClick={() => router.push('/home')} className="p-2 bg-white/20 rounded-full backdrop-blur">
          <X size={24} />
        </button>
      </div>

      <div className="h-screen w-full flex items-center justify-center overflow-hidden">
        {scanState === 'scanning' || scanState === 'loading' ? (
          <div className="w-full max-w-md aspect-square relative">
            {typeof window !== 'undefined' && (
              <QrReader
                onResult={handleScan}
                constraints={{ facingMode: 'user' }}
                className="w-full h-full"
              />
            )}
            <div className="absolute inset-0 border-2 border-[rgba(255,255,255,0.2)]">
              <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary"></div>
              <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary"></div>
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary"></div>
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary"></div>
            </div>
            {scanState === 'loading' && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <Overlay />
    </div>
  );
}
