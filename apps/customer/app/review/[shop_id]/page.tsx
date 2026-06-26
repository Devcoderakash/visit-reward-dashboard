"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, Copy, ExternalLink, Check } from 'lucide-react';
import { supabase } from '@/utils/supabase';

export default function Review() {
  const { shop_id } = useParams();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [step, setStep] = useState(1);
  const [feedback, setFeedback] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [shopName, setShopName] = useState("Loading...");
  const [shopCategory, setShopCategory] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    supabase.from('shops').select('name, category').eq('id', shop_id).single().then(({data}) => {
      if (data) {
        setShopName(data.name);
        setShopCategory(data.category);
      }
    });
  }, [shop_id]);

  const ratingLabels = ["", "Poor", "Fair", "Good", "Great", "Excellent!"];

  const handleRating = async (val: number) => {
    setRating(val);
    if (val >= 4) {
      setLoading(true);
      try {
        const res = await fetch('/api/generate-review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shop_name: shopName, shop_category: shopCategory, stars: val })
        });
        const data = await res.json();
        if (data.reviews) setSuggestions(data.reviews);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    setTimeout(() => {
      setStep(2);
    }, 500);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(-1), 2000);
  };

  const submitPrivateFeedback = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      await fetch('/api/submit-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customer_id: session.user.id, 
          shop_id, 
          star_rating: rating, 
          feedback_text: feedback 
        })
      });
      alert("Thank you for your feedback");
      router.push(`/shop/${shop_id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-6 items-center justify-center">
      {step === 1 && (
        <div className="w-full max-w-md text-center space-y-8">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg">
            {/* Google G logo simplified */}
            <span className="text-3xl font-bold text-[#4285F4]">G</span>
          </div>
          <h1 className="text-3xl font-bold">Rate {shopName}</h1>
          
          <div className="flex justify-center gap-2">
            {[1,2,3,4,5].map((star) => (
              <button key={star} onClick={() => handleRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                <Star 
                  size={48} 
                  className={star <= rating ? "fill-warning text-warning" : "text-gray-600"} 
                />
              </button>
            ))}
          </div>
          <p className="text-xl font-medium text-warning h-8">{rating > 0 ? ratingLabels[rating] : ""}</p>
        </div>
      )}

      {step === 2 && rating >= 4 && (
        <div className="w-full max-w-md space-y-6">
          <h2 className="text-2xl font-bold text-center">AI ne yeh reviews suggest kiye hain</h2>
          <p className="text-gray-400 text-center text-sm">Tap any review to copy it to your clipboard</p>

          {loading ? (
            <div className="text-center py-8 text-primary">Generating AI reviews...</div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((text, i) => (
                <button 
                  key={i} 
                  onClick={() => copyToClipboard(text, i)}
                  className="w-full text-left bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-2xl p-4 hover:border-primary transition group relative"
                >
                <p className="pr-8 text-gray-200">{text}</p>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-primary">
                  {copiedIndex === i ? <Check className="text-success" /> : <Copy />}
                </div>
              </button>
            ))}
          </div>
          )}

          <div className="pt-8">
            <a 
              href="https://google.com/maps" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition shadow-lg"
            >
              Open Google Reviews <ExternalLink size={20} />
            </a>
          </div>
        </div>
      )}

      {step === 2 && rating < 4 && (
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Thanks for your feedback</h2>
            <p className="text-gray-400">Please tell us how we can improve.</p>
          </div>

          <textarea 
            className="w-full bg-[#1a1a2e] border border-[rgba(255,255,255,0.1)] rounded-2xl p-4 min-h-[150px] focus:outline-none focus:border-primary resize-none text-white"
            placeholder="What went wrong?"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />

          <button 
            onClick={submitPrivateFeedback}
            disabled={loading || !feedback}
            className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      )}
    </div>
  );
}
