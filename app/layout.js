// app/layout.js

import { Inter } from 'next/font/google';
import RootLayoutClient from './RootLayoutClient';
import './globals.css'
import { ContextProvider } from './ContextProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Social Media App',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ContextProvider>
        <RootLayoutClient>
          {children}
        </RootLayoutClient>
        </ContextProvider>
      </body>
    </html>
  );
}
