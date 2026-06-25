import type { Metadata } from 'next';
import '@/public/css/globals.css';
import React from 'react';
import NotificationDisplayer from '@/component/notificationDisplayer';

export const metadata: Metadata = {
  title: 'Tingting',
  description: 'Money payment app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <NotificationDisplayer />
      </body>
    </html>
  );
}
