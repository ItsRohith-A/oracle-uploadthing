import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Oracle Upload Thing',
  description: 'Private file storage powered by Oracle Cloud',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="robots" content="noindex, nofollow, noarchive" />
        <meta name="googlebot" content="noindex, nofollow, noimageindex" />
      </head>
      <body className="min-h-screen antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}
