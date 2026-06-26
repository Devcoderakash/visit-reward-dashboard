"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('Signing you in...');

  useEffect(() => {
    // Supabase automatically handles the token in the URL hash
    const handleCallback = async () => {
      // Listen for auth state change triggered by the magic link token
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          subscription.unsubscribe();
          setStatus('Almost there...');

          // Check if user profile already exists
          const { data: profile } = await supabase
            .from('users')
            .select('id')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            // Existing user → go home
            router.push('/home');
          } else {
            // New user → go to welcome
            router.push('/welcome');
          }
        }
      });

      // Also check if session already exists (page reload case)
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        subscription.unsubscribe();

        const { data: profile } = await supabase
          .from('users')
          .select('id')
          .eq('id', session.user.id)
          .single();

        router.push(profile ? '/home' : '/welcome');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-lg text-gray-300">{status}</p>
      </div>
    </div>
  );
}
