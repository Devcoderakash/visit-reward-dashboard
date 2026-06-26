"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '', description: '', category: 'juice_shop', address: '', 
    opening_hours: '', instagram: '', whatsapp: '', website: '',
    email: '', password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Sign up owner
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user returned");

      // 2. Call our secure API to insert the shop and user row bypassing RLS
      const res = await fetch('/api/register-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_id: authData.user.id,
          name: formData.name,
          whatsapp: formData.whatsapp,
          description: formData.description,
          category: formData.category,
          address: formData.address,
          opening_hours: formData.opening_hours,
          instagram: formData.instagram,
          website: formData.website
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to save shop details");

      router.push('/shop/dashboard');
    } catch (err: any) {
      alert(err.message || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 text-foreground">
      <div className="w-full max-w-2xl bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
        <h1 className="text-3xl font-bold text-primary mb-6 text-center">Register your Shop</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Account Info</h2>
              <input required type="email" placeholder="Email" className="w-full border rounded-xl p-3" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} />
              <input required type="password" placeholder="Password" className="w-full border rounded-xl p-3" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Shop Details</h2>
              <input required type="text" placeholder="Shop Name" className="w-full border rounded-xl p-3" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} />
              <select className="w-full border rounded-xl p-3" value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})}>
                <option value="juice_shop">Juice Shop</option>
                <option value="cafe">Cafe</option>
                <option value="restaurant">Restaurant</option>
                <option value="bakery">Bakery</option>
                <option value="salon">Salon</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-4 md:col-span-2">
              <input type="text" placeholder="Address" className="w-full border rounded-xl p-3" value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} />
              <input type="text" placeholder="Opening Hours (e.g., 10 AM - 10 PM)" className="w-full border rounded-xl p-3" value={formData.opening_hours} onChange={e=>setFormData({...formData, opening_hours: e.target.value})} />
            </div>

            <div className="space-y-4 md:col-span-2">
              <h2 className="text-xl font-semibold">Social Links (Optional)</h2>
              <input type="url" placeholder="Instagram URL" className="w-full border rounded-xl p-3" value={formData.instagram} onChange={e=>setFormData({...formData, instagram: e.target.value})} />
              <input type="tel" placeholder="WhatsApp Number" className="w-full border rounded-xl p-3" value={formData.whatsapp} onChange={e=>setFormData({...formData, whatsapp: e.target.value})} />
              <input type="url" placeholder="Website URL" className="w-full border rounded-xl p-3" value={formData.website} onChange={e=>setFormData({...formData, website: e.target.value})} />
            </div>
          </div>
          
          <button disabled={loading} type="submit" className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-opacity-90 disabled:opacity-50 transition">
            {loading ? 'Creating...' : 'Create Shop'}
          </button>
        </form>
      </div>
    </div>
  );
}
