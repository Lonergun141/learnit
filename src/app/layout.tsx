import type { Metadata } from "next";
import { Fragment_Mono, Instrument_Serif, Inter, Poppins } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const fragmentMono = Fragment_Mono({
  variable: "--font-fragment-mono",
  subsets: ["latin"],
  weight: "400",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "LearnIT",
    template: "%s · LearnIT",
  },
  description: "Turn useful links into durable learning materials.",
};

/**
 * DESIGN CONTRACT — Signal Lab
 * Dark warm-charcoal canvas, cream type, pistachio signal. Structure is drawn
 * with hairlines and blueprint linework rather than shadows; heavy uppercase
 * display type carries hierarchy, monospace micro-labels carry metadata, and a
 * single editorial italic marks the one accent word per headline.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} ${fragmentMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
