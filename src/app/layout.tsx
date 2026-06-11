import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"] 
});

const outfit = Outfit({ 
  subsets: ["latin"], 
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700", "800", "900"] 
});

export const metadata: Metadata = {
  title: "RecyConnect Admin",
  description: "Admin panel and analytics command center for RecyConnect.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable}`} style={{ fontFamily: "var(--font-inter), sans-serif" }} suppressHydrationWarning>{children}</body>
    </html>
  );
}
