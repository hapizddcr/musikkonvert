import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "RoAudio — Convert & Upload Audio to Roblox",
  description:
    "Convert, preview, download, and upload audio to Roblox in seconds. Free, fast, and built for creators.",
  keywords: [
    "roblox audio",
    "audio converter",
    "mp3 to ogg",
    "roblox uploader",
    "open cloud",
  ],
  authors: [{ name: "RoAudio" }],
  openGraph: {
    title: "RoAudio — Convert & Upload Audio to Roblox",
    description: "Convert, preview, download, and upload audio to Roblox in seconds.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RoAudio",
    description: "Convert, preview, download, and upload audio to Roblox in seconds.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#a855f7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="relative isolate min-h-screen">
          <div className="pointer-events-none fixed inset-0 -z-10 bg-grid opacity-30" />
          <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[600px] bg-radial-purple" />
          <div className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-[400px] bg-radial-purple-bottom" />
          {children}
        </div>
        <Toaster
          position="top-center"
          theme="dark"
          toastOptions={{
            style: {
              background: "rgba(20, 20, 30, 0.9)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(168, 85, 247, 0.2)",
              color: "#fff",
            },
          }}
        />
      </body>
    </html>
  );
}
