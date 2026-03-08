import type { Metadata } from "next";
import { Inter, Playfair_Display, Hind_Siliguri } from "next/font/google";
import { supabase } from "@/lib/supabase";
import LayoutShell from "@/components/layout/LayoutShell";
import Analytics from "@/components/layout/Analytics";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const hindiFont = Hind_Siliguri({
  variable: "--font-hind",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await supabase.from("settings").select("meta_title, meta_description, google_search_console_tag").eq("id", 1).single();

  return {
    title: {
      default: data?.meta_title || "Decoding the Words | शब्दले संसार बदल्छ",
      template: `%s | ${data?.meta_title || "Decoding the Words"}`
    },
    description: data?.meta_description || "तपाईंको शब्द, तपाईंको संसार - Master the W-O-R-D framework to overcome self-doubt and beat procrastination.",
    verification: {
      google: data?.google_search_console_tag || "",
    }
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ne" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} ${hindiFont.variable} font-sans antialiased bg-offwhite text-navy`}
      >
        <Analytics />
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
