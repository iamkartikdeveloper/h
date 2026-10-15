import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://kartikdev.vercel.app'),
  title: {
    default: 'Kartik Sharma | Developer Portfolio & YouTube Tutorial Platform',
    template: '%s | Kartik Sharma',
  },
  description:
    'Explore production-ready Android, Kotlin, Flutter, Next.js, and Google AdMob programming tutorials with complete source code, video walk-throughs, and step-by-step guides.',
  keywords: [
    'Android Development',
    'Kotlin',
    'Google AdMob',
    'Flutter',
    'Dart',
    'Firebase',
    'Next.js',
    'TypeScript',
    'Software Architecture',
    'YouTube Tutorials',
  ],
  authors: [{ name: 'Kartik Sharma' }],
  creator: 'Kartik Sharma',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://kartikdev.vercel.app',
    title: 'Kartik Sharma | Developer Portfolio & YouTube Tutorial Platform',
    description:
      'Learn modern mobile and web development with in-depth video tutorials, code repositories, and implementation guides.',
    siteName: 'Kartik Sharma Tutorials & Portfolio',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200',
        width: 1200,
        height: 630,
        alt: 'Kartik Sharma Developer Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kartik Sharma | Developer & Educator',
    description:
      'High-impact Android, Flutter, and Full-Stack tutorials with source code and YouTube walk-throughs.',
    images: ['https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200'],
    creator: '@kartikdev',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200 flex flex-col justify-between">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
