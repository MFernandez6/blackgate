import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Cinzel } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "BLACKGATE™ — Blackline Public Adjusters LLC",
  description:
    "Intake infrastructure for every claim entering BLACKLINE — referral, partner, or cold.",
  applicationName: "BLACKGATE",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BLACKGATE",
  },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-180.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#05070b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrains.variable} ${cinzel.variable} bg-brand-navy text-brand-white antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
