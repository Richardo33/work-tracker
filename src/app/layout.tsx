import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "WGN — Work Gantt Navigator",
  description: "Track your job applications with clarity and calm.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen overflow-x-hidden antialiased text-slate-900`}
      >
        {/* GLOBAL background supaya gradasinya nyambung dan halus */}
        <div aria-hidden className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-linear-to-b from-indigo-50 via-slate-50 to-emerald-50" />
          <div className="absolute -top-48 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-linear-to-r from-indigo-200/45 via-sky-200/35 to-transparent blur-3xl" />
          <div className="absolute top-40 -left-56 h-[560px] w-[560px] rounded-full bg-linear-to-tr from-rose-200/25 to-transparent blur-3xl" />
          <div className="absolute bottom-0 -right-56 h-[560px] w-[560px] rounded-full bg-linear-to-tr from-emerald-200/30 to-transparent blur-3xl" />
        </div>

        {children}
      </body>
    </html>
  );
}
