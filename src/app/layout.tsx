import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';

export const metadata: Metadata = {
  title: 'AAta Chusthava — Indian Movie Deduction Game (Telugu & Hindi)',
  description:
    'Test your Tollywood and Bollywood cinema knowledge! Guess the secret Indian movie in 10 attempts using clues for director, cast, release year, box office, rating and more.',
  keywords: [
    'AAta Chusthava',
    'Indian Movie Game',
    'Telugu Movie Game',
    'Tollywood Game',
    'Bollywood Game',
    'Hindi Cinema Guessing Game',
    'Indian Cinema Deduction',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#080b11] text-slate-100 antialiased selection:bg-amber-500/30 selection:text-amber-200">
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
