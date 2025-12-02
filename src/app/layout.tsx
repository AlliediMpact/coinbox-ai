// Root layout now only defines metadata; route groups use their own layouts.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Allied iMpact Coin Box',
  description: 'Your Secure Peer-to-Peer Financial Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}


