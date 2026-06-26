export const runtime = 'edge';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AURA Rewards',
  description: 'AURA Loyalty Rewards Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
