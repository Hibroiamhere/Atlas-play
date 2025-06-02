import type { Metadata, Viewport } from 'next';
import { Toaster } from "@/components/ui/toaster"
import { PlayerProvider } from '@/context/PlayerContext'; // Changed from AuthProvider
import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#000000',
};

export const metadata: Metadata = {
  title: 'AtlasPlay',
  description: 'A geography-based word chain game',
  icons: {
    icon: [
      { url: '/icons/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icons/icon-512x512.png', type: 'image/png', sizes: '512x512' }
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180' }
    ]
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AtlasPlay',
  },
  formatDetection: {
    telephone: false,
  },
};

const InitializeTheme = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `
        (function() {
          function getInitialTheme() {
            const persistedColorPreference = window.localStorage.getItem('atlasplay-theme');
            const hasPersistedPreference = typeof persistedColorPreference === 'string';
            if (hasPersistedPreference) {
              return persistedColorPreference;
            }
            const mql = window.matchMedia('(prefers-color-scheme: dark)');
            const hasMediaQueryPreference = typeof mql.matches === 'boolean';
            if (hasMediaQueryPreference) {
              return mql.matches ? 'dark' : 'light';
            }
            return 'light';
          }
          const theme = getInitialTheme();
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
          }
        })();
      `,
    }}
  />
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <InitializeTheme />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <PlayerProvider> {/* Changed from AuthProvider */}
          {children}
        </PlayerProvider>
        <Toaster />
      </body>
    </html>
  );
}
