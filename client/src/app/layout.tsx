// app/layout.tsx
import type { Metadata } from 'next';
import { ToastProvider } from './admin/components/ToastContainer';
import './globals.css';


export const metadata: Metadata = {
  title: 'My App',
  description: 'Admin Panel',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <ToastProvider /> {/* ✅ Toasts will show anywhere in the app */}
      </body>
    </html>
  );
}
