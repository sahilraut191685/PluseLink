import './globals.css';
import { Inter } from 'next/font/google';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'PulseLink — Emergency Blood Response Platform',
  description: 'Real-time emergency blood donation coordination platform for India. Connect donors, hospitals, and blood banks instantly.',
  keywords: 'blood donation, emergency, India, donor matching, blood bank, Pune',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-white antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
