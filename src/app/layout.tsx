import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Header } from "@/components/header";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Learning Loop",
  description:
    "Tanya jawab per mata kuliah: bertanya anonim, dijawab teman dan peer mentor, diverifikasi dosen.",
};

export const viewport: Viewport = { themeColor: "#0f766e" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AuthProvider>
          <Header />
          <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
