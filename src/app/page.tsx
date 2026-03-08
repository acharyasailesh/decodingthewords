import Hero from "@/components/home/Hero";
import BookTrailer from "@/components/home/BookTrailer";
import WordFramework from "@/components/home/WordFramework";
import AuthorSection from "@/components/home/AuthorSection";
import PricingSection from "@/components/home/PricingSection";
import type { Metadata } from "next";

import { supabase } from "@/lib/supabase";

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await supabase.from("settings").select("meta_title, meta_description").eq("id", 1).single();

  return {
    title: data?.meta_title || "Decoding the Words | शब्दले संसार बदल्छ",
    description: data?.meta_description || "तपाईंको शब्द, तपाईंको संसार - Master the W-O-R-D framework to overcome self-doubt and beat procrastination.",
  };
}

export default function Home() {
  return (
    <main className="min-h-screen bg-offwhite">
      <Hero />
      <BookTrailer />
      <WordFramework />
      <AuthorSection />
      <PricingSection />
    </main>
  );
}
