"use client";

import { useEffect, useState } from "react";
import { BookOpen, Search, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Chapter = {
    id: string; // the database id
    chapter_id: string; // the human readable id like ch-1
    section_id: string;
    title_english: string;
    title_nepali?: string;
    order_index: number;
    is_preview: boolean;
};

type Section = {
    id: string;
    titleEn: string;
    titleNp: string;
    chapters: Chapter[];
};

export default function ChaptersClient() {
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContent = async () => {
            // Fetch sections
            const { data: settingsData } = await supabase.from("settings").select("book_sections").eq("id", 1).single();
            const rawSections = settingsData?.book_sections || [
                { id: "SECTION-1", titleEn: "Social Trap", titleNp: "सामाजिक जालो" },
                { id: "SECTION-2", titleEn: "The W-O-R-D Framework", titleNp: "W-O-R-D ढाँचा" },
                { id: "SECTION-3", titleEn: "Procrastination & Persistence", titleNp: "ढिलाइ र परिश्रम" },
                { id: "SECTION-4", titleEn: "WORLD Equation", titleNp: "WORLD समीकरण" },
                { id: "SPECIAL", titleEn: "Additional Sections", titleNp: "थप खण्डहरू" }
            ];

            // Fetch chapters
            const { data: chaptersData, error } = await supabase
                .from("book_content")
                .select("id, chapter_id, section_id, title_english, title_nepali, order_index, is_preview")
                .order('order_index', { ascending: true });

            if (error || !chaptersData) {
                console.error("Failed to load chapters:", error);
                setLoading(false);
                return;
            }

            // Group chapters by section
            const groupedSections = rawSections.map((s: any) => {
                return {
                    id: s.id,
                    titleEn: s.titleEn,
                    titleNp: s.titleNp,
                    chapters: chaptersData.filter(ch => ch.section_id === s.id)
                };
            });

            setSections(groupedSections);
            setLoading(false);
        };

        fetchContent();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-offwhite py-28 flex justify-center items-center">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
        );
    }

    // Separate normal sections and special sections
    const normalSections = sections.filter(s => s.id !== "SPECIAL" && s.chapters.length > 0);
    const specialSection = sections.find(s => s.id === "SPECIAL");

    return (
        <div className="min-h-screen bg-offwhite py-28">
            <div className="container mx-auto px-6 max-w-4xl">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-navy/10 bg-white text-navy text-sm font-semibold mb-4 shadow-sm">
                        <BookOpen className="w-4 h-4 text-gold" />
                        Complete Index
                    </div>
                    <h1 className="text-4xl md:text-5xl font-heading font-bold text-navy mb-3">Chapters Index</h1>
                    <h2 className="text-xl font-nepali text-black/50">पुस्तकको विस्तृत सामग्री</h2>
                </div>

                <div className="space-y-8">
                    {normalSections.map((section, sIdx) => (
                        <div key={section.id} className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
                            <div className="bg-navy px-6 py-4 flex items-center gap-4">
                                <span className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 text-gold flex items-center justify-center font-bold text-sm">{sIdx + 1}</span>
                                <div>
                                    <h3 className="text-white font-heading font-bold text-lg">{section.titleEn}</h3>
                                    <p className="text-white/50 text-sm font-nepali">{section.titleNp}</p>
                                </div>
                            </div>
                            <ul className="divide-y divide-black/5">
                                {section.chapters.map((ch) => (
                                    <li key={ch.id}>
                                        <Link href={`/read/${ch.chapter_id}`} className="flex items-center justify-between px-6 py-4 hover:bg-offwhite transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <span className="w-7 h-7 rounded-full bg-gold/10 text-gold flex items-center justify-center text-xs font-bold shrink-0">{ch.order_index}</span>
                                                <div>
                                                    <p className="font-semibold text-navy group-hover:text-gold transition-colors">{ch.title_english}</p>
                                                    {ch.title_nepali && <p className="text-sm font-nepali text-black/50 mt-0.5">{ch.title_nepali}</p>}
                                                </div>
                                                {ch.is_preview && (
                                                    <span className="ml-2 text-[10px] font-bold uppercase tracking-wider bg-gold/20 text-gold px-2 py-0.5 rounded-md">Free</span>
                                                )}
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-black/20 group-hover:text-gold transition-colors shrink-0" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    {/* Special Sections */}
                    {specialSection && specialSection.chapters.length > 0 && (
                        <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
                            <div className="bg-sepia px-6 py-4">
                                <h3 className="text-navy font-heading font-bold text-lg">{specialSection.titleEn}</h3>
                                {specialSection.titleNp && <p className="text-navy/60 text-sm font-nepali">{specialSection.titleNp}</p>}
                            </div>
                            <ul className="divide-y divide-black/5">
                                {specialSection.chapters.map((ch) => (
                                    <li key={ch.id}>
                                        <Link href={`/read/${ch.chapter_id}`} className="flex items-center justify-between px-6 py-4 hover:bg-offwhite transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <span className="w-7 h-7 rounded-full bg-navy/5 text-navy/40 flex items-center justify-center text-xs font-bold shrink-0">→</span>
                                                <div>
                                                    <p className="font-semibold text-navy group-hover:text-gold transition-colors">{ch.title_english}</p>
                                                    {ch.title_nepali && <p className="text-sm font-nepali text-black/50">{ch.title_nepali}</p>}
                                                </div>
                                                {ch.is_preview && (
                                                    <span className="ml-2 text-[10px] font-bold uppercase tracking-wider bg-gold/20 text-gold px-2 py-0.5 rounded-md">Free</span>
                                                )}
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-black/20 group-hover:text-gold transition-colors shrink-0" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="mt-12 text-center">
                    <Link href="/buy" className="inline-flex items-center gap-2 bg-navy hover:bg-navy/90 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg">
                        <Search className="w-5 h-5" /> Unlock Full Access — NPR 499
                    </Link>
                </div>
            </div>
        </div>
    );
}
