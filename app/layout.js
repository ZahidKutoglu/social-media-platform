// app/layout.js

import { Inter } from 'next/font/google';
import RootLayoutClient from './RootLayoutClient';
import './globals.css'
import { ContextProvider } from './ContextProvider';
import { Analytics } from "@vercel/analytics/react"


const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Social Media App',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Analytics />
        <ContextProvider>
        <RootLayoutClient>
          {children}
        </RootLayoutClient>
        </ContextProvider>
      </body>
    </html>
  );
}
