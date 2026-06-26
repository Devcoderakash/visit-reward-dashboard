import Link from 'next/link';
import { QrCode, Gift } from 'lucide-react';

export default function Welcome() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background text-foreground">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-2">Welcome to AURA</h1>
          <p className="text-gray-300 text-lg">Your universal loyalty platform</p>
        </div>

        <div className="space-y-4">
          <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 flex items-center gap-4">
            <div className="bg-primary/20 p-3 rounded-full text-primary">
              <QrCode size={32} />
            </div>
            <div>
              <h3 className="font-bold text-xl">Scan a shop QR to start</h3>
              <p className="text-gray-400 text-sm">Just scan the AURA code at the counter to record your visit.</p>
            </div>
          </div>

          <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 flex items-center gap-4">
            <div className="bg-warning/20 p-3 rounded-full text-warning">
              <Gift size={32} />
            </div>
            <div>
              <h3 className="font-bold text-xl">5 visits = scratch card</h3>
              <p className="text-gray-400 text-sm">Every 5th visit unlocks a surprise reward from the shop.</p>
            </div>
          </div>
        </div>

        <div className="pt-8">
          <Link href="/home" className="block w-full bg-primary text-white text-center font-bold py-4 rounded-xl hover:bg-opacity-90 transition shadow-lg shadow-primary/25">
            Get started
          </Link>
        </div>
      </div>
    </div>
  );
}
