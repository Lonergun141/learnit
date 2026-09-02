import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "LearnIT",
    template: "%s · LearnIT",
  },
  description: "Turn useful links into durable learning materials.",
};

/**
 * DESIGN CONTRACT — Metropolitan learning network
 * Operate-mode UI: warm paper canvas, white work surfaces, deep green-black
 * navigation, signal green for action/current state, and station-like status
 * markers. Compact hierarchy, restrained depth, no decorative gradients.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
