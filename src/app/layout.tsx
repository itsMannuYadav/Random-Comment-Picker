import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CommandPaletteProvider } from "@/components/command-palette/command-palette";
import { appConfig } from "@/lib/env";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(appConfig.url),
  title: {
    default: `${appConfig.name} — Your Social Media Toolbox`,
    template: `%s — ${appConfig.name}`,
  },
  description:
    "Pick winners, work with thumbnails, prepare media, clean URLs and more - all from one fast creator toolkit. Starting with a fair, verifiable comment picker for YouTube, Reddit, Instagram and more.",
  authors: [{ name: "Mannu Yadav", url: appConfig.url }],
  creator: "Mannu Yadav",
  openGraph: {
    title: `${appConfig.name} — Your Social Media Toolbox`,
    description: "Everything creators need, in one place.",
    siteName: appConfig.name,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <CommandPaletteProvider>
          <Header />
          {children}
          <Footer />
        </CommandPaletteProvider>
      </body>
    </html>
  );
}
