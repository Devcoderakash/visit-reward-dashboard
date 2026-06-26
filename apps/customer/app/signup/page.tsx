"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: `+91${mobile}`,
    });
    setLoading(false);
    if (error) {
      alert(error.message);
    } else {
      setStep(2);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      phone: `+91${mobile}`,
      token: otp.join(''),
      type: 'sms',
    });
    setLoading(false);

    if (error) {
      alert(error.message);
    } else if (data.user) {
      // Insert into users if not exists
      await supabase.from('users').upsert({
        id: data.user.id,
        name: name,
        mobile: `+91${mobile}`,
        role: 'customer'
      }, { onConflict: 'id' });
      
      router.push('/welcome');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background text-foreground">
      <div className="w-full max-w-md bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 shadow-xl">
        <h1 className="text-3xl font-bold text-center mb-6 text-primary">AURA Rewards</h1>
        
        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#1a1a2e] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mobile Number</label>
              <div className="flex">
                <span className="bg-[#1a1a2e] border border-r-0 border-[rgba(255,255,255,0.1)] rounded-l-xl px-4 py-3 text-gray-400">+91</span>
                <input 
                  type="tel" 
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full bg-[#1a1a2e] border border-[rgba(255,255,255,0.1)] rounded-r-xl px-4 py-3 focus:outline-none focus:border-primary"
                  placeholder="Enter 10 digit number"
                  maxLength={10}
                />
              </div>
            </div>
            <button 
              onClick={handleSendOtp}
              disabled={loading || mobile.length < 10 || !name}
              className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-opacity-90 transition disabled:opacity-50 mt-4"
            >
              {loading ? 'Sending OTP...' : 'Get OTP'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-center text-sm text-gray-300">Enter the 4-digit code sent to +91 {mobile}</p>
            <div className="flex justify-center gap-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => {
                    const newOtp = [...otp];
                    newOtp[index] = e.target.value;
                    setOtp(newOtp);
                    if (e.target.value && index < 3) {
                      document.getElementById(`otp-${index + 1}`)?.focus();
                    }
                  }}
                  className="w-14 h-14 text-center text-2xl font-bold bg-[#1a1a2e] border border-[rgba(255,255,255,0.1)] rounded-xl focus:outline-none focus:border-primary"
                />
              ))}
            </div>
            <button 
              onClick={handleVerify}
              disabled={loading || otp.join('').length < 4}
              className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
