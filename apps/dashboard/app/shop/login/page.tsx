"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      alert(error.message);
    } else {
      router.push('/shop/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-foreground">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
        <h1 className="text-3xl font-bold text-center text-primary mb-8">Shop Owner Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input required type="email" placeholder="Email" className="w-full border rounded-xl p-4 focus:border-primary focus:outline-none" value={email} onChange={e=>setEmail(e.target.value)} />
          <input required type="password" placeholder="Password" className="w-full border rounded-xl p-4 focus:border-primary focus:outline-none" value={password} onChange={e=>setPassword(e.target.value)} />
          <button disabled={loading} type="submit" className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-opacity-90 disabled:opacity-50 mt-4 transition">
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-gray-500">
          New here? <a href="/shop/register" className="text-primary font-semibold hover:underline">Register your shop</a>
        </div>
      </div>
    </div>
  );
}
