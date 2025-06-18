import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Analytics } from "@vercel/analytics/next";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Perpflow  | Real-time Perpetual futures analytics",
  description: "Real-time crypto futures analytics platform with advanced institutional activity detection",
  keywords: "bybit, binance, crypto, futures, trading, analysis, trends, charts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.variable} antialiased font-poppins`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Analytics/>
      </body>
    </html>
  );
}
