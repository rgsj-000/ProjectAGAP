import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { NavigationProvider } from "@/context/NavigationContext";

export const metadata: Metadata = {
  title: "PROJECT AGAP — AI-Guided Assessment and Prioritization (Lucena City)",
  description:
    "Disaster preparedness and recovery decision-support platform for Philippine Local Government Units (LGUs). Piloted in Lucena City, Quezon.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1d4ed8",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white antialiased">
        <LanguageProvider>
          <NavigationProvider>{children}</NavigationProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
