"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { Mail, Phone, User, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    setError('');
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (mobile.length < 10) { setError('Please enter a valid 10-digit mobile number.'); return; }
    if (!email.includes('@')) { setError('Please enter a valid email address.'); return; }

    setLoading(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email,
      options: { shouldCreateUser: true }
    });
    setLoading(false);

    if (otpError) {
      setError(otpError.message);
    } else {
      setStep(2);
    }
  };

  const handleVerify = async () => {
    setError('');
    setLoading(true);
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: email,
      token: otp.join(''),
      type: 'email',
    });
    setLoading(false);

    if (verifyError) {
      setError(verifyError.message);
    } else if (data.user) {
      // Upsert into users table with name and mobile
      await supabase.from('users').upsert({
        id: data.user.id,
        name: name.trim(),
        mobile: `+91${mobile}`,
        role: 'customer'
      }, { onConflict: 'id' });

      router.push('/welcome');
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    // Handle paste
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => { if (i < 6) newOtp[i] = d; });
      setOtp(newOtp);
      const nextIndex = Math.min(digits.length, 5);
      document.getElementById(`otp-${nextIndex}`)?.focus();
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, '');
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background text-foreground">
      <div className="w-full max-w-md bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-2xl p-8 shadow-xl">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-1">AURA Rewards</h1>
          <p className="text-gray-400 text-sm">
            {step === 1 ? 'Create your account to start earning rewards' : `Enter the 6-digit code sent to ${email}`}
          </p>
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-300">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#1a1a2e] border border-[rgba(255,255,255,0.1)] rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:border-primary"
                  placeholder="Enter your name"
                />
              </div>
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-300">Mobile Number</label>
              <div className="flex">
                <span className="bg-[#1a1a2e] border border-r-0 border-[rgba(255,255,255,0.1)] rounded-l-xl px-3 py-3 text-gray-400 flex items-center gap-1">
                  <Phone size={14} /> +91
                </span>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-[#1a1a2e] border border-[rgba(255,255,255,0.1)] rounded-r-xl px-4 py-3 focus:outline-none focus:border-primary"
                  placeholder="10 digit number"
                  maxLength={10}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-300">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1a1a2e] border border-[rgba(255,255,255,0.1)] rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:border-primary"
                  placeholder="you@example.com"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">OTP will be sent to this email (free & instant)</p>
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-opacity-90 transition disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? 'Sending OTP...' : <><span>Get OTP</span><ArrowRight size={18} /></>}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-center mb-2">
              <div className="bg-primary/20 p-4 rounded-full text-primary">
                <ShieldCheck size={40} />
              </div>
            </div>

            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  className="w-11 h-12 text-center text-xl font-bold bg-[#1a1a2e] border border-[rgba(255,255,255,0.1)] rounded-xl focus:outline-none focus:border-primary"
                />
              ))}
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button
              onClick={handleVerify}
              disabled={loading || otp.join('').length < 6}
              className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <button
              onClick={() => { setStep(1); setOtp(['', '', '', '', '', '']); setError(''); }}
              className="w-full text-gray-400 text-sm hover:text-white transition"
            >
              ← Change email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
