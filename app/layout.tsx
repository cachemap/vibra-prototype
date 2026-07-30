import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const figtree = Inter({
  subsets: ["latin"],
  variable: "--font-figtree"
});

export const metadata: Metadata = {
  title: "Vibra",
  description: "Sound and haptic design system workspace"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${figtree.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
