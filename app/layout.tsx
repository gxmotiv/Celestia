import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Celestia - Multi-System Astrology & Numerology Matrix',
  description: 'Comprehensive client-side celestial engine calculating Western natal charts & synastry, Vedic Kundli, 10 Classical 5-Level Vedic Dasha Systems (Vimshottari, Yogini, Jaimini Chara, Ashtottari, Kalachakra, Shodashottari, Dwisaptati, Shastihayani, Sthira, Mandooka) with cross-system convergence & comparative matrix, Ashtakoota Milan (36 Gunas), Pythagorean numerology, and BaZi Four Pillars.',
  openGraph: {
    title: 'Celestia - Multi-System Astrology & Numerology Matrix',
    description: 'Comprehensive client-side celestial engine calculating Western natal charts & synastry, Vedic Kundli, 10 Classical 5-Level Vedic Dasha Systems (Vimshottari, Yogini, Jaimini Chara, Ashtottari, Kalachakra, Shodashottari, Dwisaptati, Shastihayani, Sthira, Mandooka) with cross-system convergence & comparative matrix, Ashtakoota Milan (36 Gunas), Pythagorean numerology, and BaZi Four Pillars.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Celestia - Multi-System Astrology & Numerology Matrix',
    description: 'Comprehensive client-side celestial engine calculating Western natal charts & synastry, Vedic Kundli, 10 Classical 5-Level Vedic Dasha Systems (Vimshottari, Yogini, Jaimini Chara, Ashtottari, Kalachakra, Shodashottari, Dwisaptati, Shastihayani, Sthira, Mandooka) with cross-system convergence & comparative matrix, Ashtakoota Milan (36 Gunas), Pythagorean numerology, and BaZi Four Pillars.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="dark">
      <body suppressHydrationWarning className="bg-[#090b10] text-slate-100 antialiased selection:bg-amber-500/20 selection:text-amber-200">
        {children}
      </body>
    </html>
  );
}
