"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BookOpen, Search, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";

type Chapter = {
    chapter_id: string;
    section_id: string;
    title_english: string;
    title_nepali: string;
    order_index: number;
    is_preview: boolean;
};

type Section = {
    id: string;
    titleEn: string;
    titleNp: string;
    chapters: Chapter[];
};

export default function ChaptersIndex() {
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            // 1. Fetch sections from settings
            const { data: settingsData } = await supabase.from("settings").select("book_sections").eq("id", 1).single();
            const bookSections = settingsData?.book_sections || [];

            // 2. Fetch all chapters
            const { data: chaptersData } = await supabase
                .from("book_content")
                .select("chapter_id, section_id, title_english, title_nepali, order_index, is_preview")
                .order("order_index", { ascending: true });

            const chapters: Chapter[] = chaptersData || [];

            // 3. Group chapters into sections
            const grouped = bookSections.map((sec: any) => ({
                ...sec,
                chapters: chapters.filter(ch => ch.section_id === sec.id)
            }));

            // 4. Handle chapters that don't match any section (if any)
            const matchedIds = new Set(bookSections.map((s: any) => s.id));
            const orphanChapters = chapters.filter(ch => !matchedIds.has(ch.section_id));

            if (orphanChapters.length > 0) {
                grouped.push({
                    id: "ORPHAN",
                    titleEn: "Uncategorized",
                    titleNp: "अवगीकृत",
                    chapters: orphanChapters
                });
            }

            setSections(grouped);
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-offwhite">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-offwhite pt-44 pb-20">
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
                    {sections.filter(s => s.chapters.length > 0).map((section, sIdx) => (
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
                                    <li key={ch.chapter_id}>
                                        <Link href={`/read/${ch.chapter_id}`} className="flex items-center justify-between px-6 py-4 hover:bg-offwhite transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <span className="w-7 h-7 rounded-full bg-gold/10 text-gold flex items-center justify-center text-xs font-bold shrink-0">
                                                    {ch.order_index > 0 ? ch.order_index : "→"}
                                                </span>
                                                <div>
                                                    <p className="font-semibold text-navy group-hover:text-gold transition-colors">
                                                        {ch.title_english}
                                                        {ch.is_preview && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Preview</span>}
                                                    </p>
                                                    <p className="text-sm font-nepali text-black/50 mt-0.5">{ch.title_nepali}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-black/20 group-hover:text-gold transition-colors shrink-0" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
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
