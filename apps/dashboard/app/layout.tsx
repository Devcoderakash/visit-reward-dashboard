import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AURA Dashboard',
  description: 'AURA Loyalty Rewards Dashboard',
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
