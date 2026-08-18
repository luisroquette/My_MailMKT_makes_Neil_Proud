import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar, NavMobile } from "@/components/sidebar";

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
    "Demo do cockpit do My_MailMKT — throttle, dispatcher, outbox e campanhas de marketing do motor portátil de e-mail.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-muted/30">
        <NavMobile />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 min-w-0 p-6 lg:p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
