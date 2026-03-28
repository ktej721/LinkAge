import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import { cn } from "@/lib/utils";



const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LinkAge",
  description: "Bridging Generations, One Question at a Time",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
