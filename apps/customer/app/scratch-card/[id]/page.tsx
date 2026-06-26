"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Gift } from 'lucide-react';
import { supabase } from '@/utils/supabase';

export default function ScratchCard() {
  const { id } = useParams();
  const router = useRouter();
  const [scratched, setScratched] = useState(false);
  const [cardData, setCardData] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const fetchCard = async () => {
      if (!id) return;
      const { data } = await supabase.from('scratch_cards').select('*').eq('id', id).single();
      if (data) setCardData(data);
    };
    fetchCard();
  }, [id]);

  useEffect(() => {
    if (scratched && cardData && !cardData.is_revealed) {
      supabase.from('scratch_cards').update({ is_revealed: true }).eq('id', id).then();
    }
  }, [scratched, cardData, id]);

  const rewardText = cardData?.reward_text || "Loading...";
  const redemptionCode = cardData?.redemption_code || "XXXX";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Fill with silver scratch material
    ctx.fillStyle = '#a0a0a0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some pattern
    ctx.fillStyle = '#909090';
    for(let i=0; i<50; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 20, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SCRATCH HERE', canvas.width / 2, canvas.height / 2);

    let isDrawing = false;
    
    const scratch = (x: number, y: number) => {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, Math.PI * 2);
      ctx.fill();
      
      // Check if enough is scratched
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let transparentPixels = 0;
      // sampling every 4th pixel for performance
      for (let i = 3; i < imgData.data.length; i += 16) {
        if (imgData.data[i] === 0) transparentPixels++;
      }
      const totalSampledPixels = imgData.data.length / 16;
      if (transparentPixels / totalSampledPixels > 0.4 && !scratched) {
        setScratched(true);
        canvas.style.opacity = '0';
      }
    };

    const getCoordinates = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      // Calculate scaling
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      if ('touches' in e) {
        return {
          x: (e.touches[0].clientX - rect.left) * scaleX,
          y: (e.touches[0].clientY - rect.top) * scaleY
        };
      }
      return {
        x: ((e as MouseEvent).clientX - rect.left) * scaleX,
        y: ((e as MouseEvent).clientY - rect.top) * scaleY
      };
    };

    const startDrawing = (e: any) => {
      isDrawing = true;
      const {x, y} = getCoordinates(e);
      scratch(x, y);
    };

    const stopDrawing = () => { isDrawing = false; };

    const draw = (e: any) => {
      if (!isDrawing) return;
      if(e.cancelable) e.preventDefault();
      const {x, y} = getCoordinates(e);
      scratch(x, y);
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseleave', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  }, [scratched]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-foreground">
      <div className="inline-flex bg-warning/20 p-4 rounded-full text-warning mb-6">
        <Gift size={48} />
      </div>
      <h1 className="text-3xl font-bold text-center mb-12">5 visits complete!</h1>

      <div className="relative w-full max-w-sm aspect-[3/2] bg-gradient-to-br from-primary to-purple-800 rounded-2xl shadow-2xl flex flex-col items-center justify-center text-center p-6 mb-12 overflow-hidden border border-white/20">
        {/* Underlying Reward */}
        <div className="z-0">
          <h2 className="text-2xl font-bold text-white mb-2">{rewardText}</h2>
          <div className="bg-white/20 rounded-lg px-6 py-3 backdrop-blur mt-4">
            <span className="text-sm uppercase tracking-widest text-white/80 block mb-1">Code</span>
            <span className="text-4xl font-mono font-bold tracking-widest text-white">{redemptionCode}</span>
          </div>
        </div>

        {/* Scratch layer overlay */}
        <canvas 
          ref={canvasRef}
          width={600}
          height={400}
          className="absolute inset-0 w-full h-full z-10 transition-opacity duration-1000 cursor-pointer"
        />
      </div>

      {scratched && (
        <div className="w-full max-w-sm text-center">
          <p className="text-warning mb-6">Valid for 10 minutes, show to staff</p>
          <button 
            onClick={() => router.push('/home')}
            className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-opacity-90 transition shadow-lg shadow-primary/25"
          >
            Back to home
          </button>
        </div>
      )}
    </div>
  );
}
