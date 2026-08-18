import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mail MKT · Cockpit",
  description:
    "Demo dashboard of the My_MailMKT portable email engine — throttle, dispatcher, outbox and marketing campaigns.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-muted/30">
        <Sidebar />
        <main className="flex-1 min-w-0 p-6 lg:p-8">{children}</main>
      </body>
    </html>
  );
}
