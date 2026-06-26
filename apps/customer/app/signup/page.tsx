"use client";

import { useState } from 'react';
import { Mail, Phone, User, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Signup() {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'form' | 'sent'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (mobile.length < 10) { setError('Please enter a valid 10-digit mobile number.'); return; }
    if (!email.includes('@') || !email.includes('.')) { setError('Please enter a valid email address.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), mobile, email: email.toLowerCase().trim() })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
      } else {
        setStep('sent');
      }
    } catch (e) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background text-foreground">
      <div className="w-full max-w-md bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-2xl p-8 shadow-xl">

        {step === 'form' ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-primary mb-1">AURA Rewards</h1>
              <p className="text-gray-400 text-sm">Create your account to start earning rewards</p>
            </div>

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
                  <span className="bg-[#1a1a2e] border border-r-0 border-[rgba(255,255,255,0.1)] rounded-l-xl px-3 py-3 text-gray-400 flex items-center gap-1 text-sm">
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
                <p className="text-xs text-gray-500 mt-1">A login link will be sent to this email</p>
              </div>

              {error && (
                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-opacity-90 transition disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending link...
                  </span>
                ) : (
                  <><span>Send Login Link</span><ArrowRight size={18} /></>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center space-y-6 py-4">
            <div className="flex justify-center">
              <div className="bg-green-500/20 p-5 rounded-full text-green-400">
                <CheckCircle2 size={56} />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Check your email!</h2>
              <p className="text-gray-400 text-sm">
                We sent a login link to <br />
                <span className="text-white font-semibold">{email}</span>
              </p>
              <p className="text-gray-500 text-xs mt-3">
                Click the link in the email to sign in. <br />
                Check your spam folder if you don't see it.
              </p>
            </div>
            <button
              onClick={() => { setStep('form'); setError(''); }}
              className="text-primary text-sm hover:underline"
            >
              ← Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
