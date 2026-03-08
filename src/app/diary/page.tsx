"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { BookOpen, BookText, ArrowLeft, Loader2, Calendar } from "lucide-react";
import Link from "next/link";

type DiaryEntry = {
    chapter_index: number;
    chapter_title: string;
    content: string;
    language?: "english" | "nepali" | "bilingual" | "preeti" | "times";
    id: string; // generated
};

export default function DiaryView() {
    const [entries, setEntries] = useState<DiaryEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDiary = async () => {
            // Fetch all chapters ordered
            const { data } = await supabase
                .from("book_content")
                .select("chapter_id, title_english, order_index, content_blocks")
                .order("order_index", { ascending: true });

            if (data) {
                const allEntries: DiaryEntry[] = [];
                data.forEach((chapter) => {
                    if (chapter.content_blocks && Array.isArray(chapter.content_blocks)) {
                        chapter.content_blocks.forEach((block: any, idx: number) => {
                            if (block.type === "diary") {
                                allEntries.push({
                                    chapter_index: chapter.order_index,
                                    chapter_title: chapter.title_english,
                                    content: block.content,
                                    language: block.language,
                                    id: `${chapter.chapter_id}-${idx}`
                                });
                            }
                        });
                    }
                });
                setEntries(allEntries);
            }
            setLoading(false);
        };
        fetchDiary();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <div className="animate-pulse text-gold flex items-center gap-3">
                    <Loader2 className="animate-spin w-8 h-8" /> 
                    <span className="font-heading font-bold text-xl uppercase tracking-widest text-[#5F4B32]">Opening Diary...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#5F4B32] selection:bg-gold/30">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#E1D9C6] px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/read" className="p-2 hover:bg-black/5 rounded-full transition-colors group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <h1 className="font-heading font-black text-xl tracking-widest uppercase flex items-center gap-2">
                        <BookText className="w-5 h-5 text-gold" />
                        Sameer's Diary
                    </h1>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-12 md:py-24">
                
                {/* Title Section */}
                <div className="text-center mb-20">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gold/10 flex items-center justify-center text-gold mb-6 border border-gold/30">
                        <span className="text-3xl font-serif">📔</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-heading font-black mb-4 text-[#3D2B1F]">The Honest Thread</h1>
                    <p className="text-lg md:text-xl font-medium text-[#5F4B32]/70 max-w-lg mx-auto italic">
                        Sameer's raw notes, reflections, and emotional arc, extracted from the chapters into a single chronological timeline.
                    </p>
                    <div className="w-24 h-px bg-gold/50 mx-auto mt-12" />
                </div>

                {/* Timeline */}
                <div className="space-y-16">
                    {entries.map((entry, idx) => {
                        const isPreeti = entry.language === "preeti";
                        const isNepali = entry.language === "nepali";
                        const fontClass = isPreeti ? "font-preeti text-2xl" : isNepali ? "font-nepali text-xl" : "font-sans text-lg";

                        return (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.6 }}
                                className="relative pl-8 md:pl-0"
                            >
                                {/* Timeline Line (Desktop only, centered) */}
                                <div className="absolute left-0 md:left-1/2 top-4 bottom-[-64px] w-px bg-gold/30 md:-translate-x-1/2 hidden md:block" />
                                
                                <div className={`md:w-1/2 ${idx % 2 === 0 ? "md:pr-12 md:ml-0" : "md:pl-12 md:ml-auto"} relative`}>
                                    
                                    {/* Timeline Node */}
                                    <div className="absolute left-[-32px] md:left-auto md:top-4 w-4 h-4 rounded-full bg-gold shadow-[0_0_10px_rgba(184,134,11,0.5)] z-10" 
                                         style={{ 
                                            [idx % 2 === 0 ? "right" : "left"]: "auto",
                                            ...(idx % 2 === 0 ? { right: "-55px" } : { left: "-55px" })
                                         }} 
                                    />

                                    {/* Entry Card */}
                                    <div 
                                        className="p-8 shadow-xl border border-gold/20 rounded-2xl relative bg-white overflow-hidden transform transition-transform hover:-translate-y-1 hover:shadow-2xl"
                                        style={{
                                            backgroundImage: "linear-gradient(#f4e4c8 1px, transparent 1px)",
                                            backgroundSize: "100% 2.5rem",
                                            lineHeight: "2.5rem",
                                        }}
                                    >
                                        <div className="absolute top-0 right-8 w-6 h-10 bg-red-600/10 border-x border-red-900/10" />
                                        
                                        <div className="mb-6 flex items-center justify-between border-b-2 border-[#5F4B32]/10 pb-2">
                                            <span className="text-xs font-bold uppercase tracking-widest text-gold flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                Phase {entry.chapter_index}
                                            </span>
                                            <span className="text-xs font-mono opacity-50 truncate max-w-[120px]">{entry.chapter_title}</span>
                                        </div>

                                        <div className={`whitespace-pre-wrap break-words text-justify italic diary-content ${entry.language === 'english' ? 'font-mono' : ''} ${fontClass} text-[#3D2B1F]`}>
                                            {/* Quick html parser same as ReaderMode */}
                                            {(() => {
                                                const glued = entry.content.replace(/ (।|!|\?|:|;)/g, '\u00A0$1');
                                                return entry.content.includes('<') ? (
                                                    <span dangerouslySetInnerHTML={{ __html: glued }} />
                                                ) : (
                                                    <span>{glued}</span>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}

                    {entries.length === 0 && !loading && (
                        <div className="text-center italic opacity-50 py-20">
                            No diary entries found in the current chapters.
                        </div>
                    )}
                </div>

                <div className="mt-32 text-center flex flex-col items-center">
                    <span className="text-gold text-3xl">✦</span>
                    <p className="text-xs font-bold uppercase tracking-[0.3em] mt-4 opacity-40">End of Diary</p>
                </div>
            </main>
        </div>
    );
}
