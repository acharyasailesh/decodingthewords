"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { BookOpen, Download, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

type Reflection = {
    id: string;
    chapter_id: string;
    content: string;
    created_at: string;
}

type ChapterData = {
    chapter_id: string;
    title_english: string;
    title_nepali: string;
    section_id: string;
}

export default function MyJournal() {
    const [reflections, setReflections] = useState<Reflection[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [chapterInfo, setChapterInfo] = useState<Record<string, ChapterData>>({});
    const [sections, setSections] = useState<any[]>([]);

    useEffect(() => {
        const fetchReflections = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setLoading(false);
                return;
            }
            setUser(session.user);

            // Fetch reflections
            const { data: reflects } = await supabase
                .from("user_reflections")
                .select("*")
                .eq("user_id", session.user.id)
                .order("created_at", { ascending: true });

            // Fetch chapter data for lookup
            const { data: chapters } = await supabase
                .from("book_content")
                .select("chapter_id, title_english, title_nepali, section_id");

            // Fetch sections from settings
            const { data: settings } = await supabase
                .from("settings")
                .select("book_sections")
                .single();

            if (settings?.book_sections) {
                setSections(settings.book_sections);
            }

            if (chapters) {
                const mapping = chapters.reduce((acc: any, ch: any) => {
                    acc[ch.chapter_id] = ch;
                    return acc;
                }, {});
                setChapterInfo(mapping);
            }

            if (reflects) {
                // Filter out automatic sync placeholders so the journal stays clean
                const actualReflections = reflects.filter(r => r.content !== "[Chapter Read]");
                setReflections(actualReflections);
            }
            setLoading(false);
        };
        fetchReflections();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-navy flex items-center justify-center">
                <div className="animate-pulse text-gold flex items-center gap-3">
                    <BookOpen className="animate-spin w-6 h-6" /> Loading Journal...
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-navy flex items-center justify-center flex-col gap-6 text-white p-6 text-center">
                <AlertCircle className="w-16 h-16 text-red-400" />
                <h1 className="text-3xl font-heading font-black">Please Sign In</h1>
                <p className="text-white/60 max-w-sm">You must be logged in to access and compile your Personal Decoding Journal.</p>
                <Link href="/login" className="px-6 py-3 bg-gold text-navy font-bold rounded-xl hover:scale-105 transition-all">Sign In</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] print:bg-white text-navy selection:bg-gold/20">
            {/* Non-printable header */}
            <div className="print:hidden sticky top-0 z-50 bg-[#0A0E1A] text-white px-6 py-4 flex items-center justify-between shadow-2xl border-b border-white/5">
                <div className="flex items-center gap-6">
                    <Link href="/read" className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div>
                        <h1 className="font-heading font-black text-xl tracking-tight">Personal Journal</h1>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Decoding The Words</p>
                    </div>
                </div>
                <button 
                    onClick={handlePrint}
                    className="flex items-center gap-3 bg-gold text-navy px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-gold/20"
                >
                    <Download className="w-4 h-4" /> Download PDF
                </button>
            </div>

            {/* Printable Content */}
            <div className="max-w-4xl mx-auto p-12 md:p-24 print:p-0 print:m-0 space-y-20">
                
                {/* Journal Cover */}
                <div className="text-center space-y-8 pb-20 border-b-2 border-navy/5 print:border-none print:break-after-page flex flex-col items-center">
                    <div className="w-28 h-28 rounded-[2.5rem] bg-navy flex items-center justify-center text-gold mb-4 rotate-3 shadow-2xl print:border-2 print:border-navy print:bg-white print:text-navy">
                        <BookOpen className="w-12 h-12" />
                    </div>
                    <div className="space-y-4">
                        <p className="font-heading font-black text-gold uppercase tracking-[0.4em] text-xs">A Lifetime Companion</p>
                        <h1 className="text-6xl md:text-7xl font-heading font-black tracking-tighter leading-none">Journal <br/><span className="text-navy/20">Reflections</span></h1>
                    </div>
                    
                    <div className="h-px w-24 bg-navy/10 my-8"/>
                    
                    <div className="space-y-2">
                        <p className="font-medium text-xl text-navy/60">Property of <span className="text-navy font-bold">{user.email}</span></p>
                        <p className="text-[10px] text-navy/30 font-black uppercase tracking-[0.2em] mt-10">Compiled on {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                </div>

                {reflections.length === 0 ? (
                    <div className="text-center py-32 print:hidden bg-navy/[0.02] border-2 border-dashed border-navy/5 rounded-[3rem]">
                        <BookOpen className="w-12 h-12 mx-auto mb-6 opacity-10" />
                        <p className="text-navy/40 font-bold uppercase tracking-widest text-sm">No entries discovered yet</p>
                        <p className="text-navy/20 text-xs mt-2">Complete reflections at the end of each chapter</p>
                    </div>
                ) : (
                    <div className="space-y-24 print:space-y-12">
                        {reflections.map((ref, idx) => {
                            const info = chapterInfo[ref.chapter_id];
                            const sectionIndex = sections.findIndex(s => s.id === info?.section_id);
                            const section = sectionIndex !== -1 ? sections[sectionIndex] : null;
                            const sectionLetters = ["W", "O", "R", "D"];
                            const letter = sectionIndex !== -1 && sectionIndex < 4 ? sectionLetters[sectionIndex] : "G";

                            return (
                                <motion.div 
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    key={ref.id} 
                                    className="relative print:break-inside-avoid group"
                                >
                                    <div className="grid md:grid-cols-[1.2fr_2.5fr] gap-12">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="px-3 py-1 bg-gold/10 text-gold text-[10px] font-black uppercase tracking-widest rounded-lg border border-gold/20">
                                                    Reflection {idx + 1}
                                                </div>
                                                {section && (
                                                    <div className="flex items-center gap-2 px-3 py-1 bg-navy/5 text-navy/40 text-[9px] font-black uppercase tracking-widest rounded-lg border border-navy/10">
                                                        <span className="text-gold font-black">{letter}</span> — {section.titleEn}
                                                    </div>
                                                )}
                                            </div>
                                            <Link href={`/read/${ref.chapter_id}`} className="block group/title print:no-underline">
                                                <div className="space-y-2">
                                                    <h3 className="font-heading font-black text-2xl text-navy leading-[1.1] group-hover/title:text-gold transition-colors">
                                                        {info?.title_english || ref.chapter_id.replace(/-/g, ' ')}
                                                    </h3>
                                                    {info?.title_nepali && (
                                                        <p className="text-lg font-nepali text-navy/40 font-bold leading-tight group-hover/title:text-gold/60 transition-colors">
                                                            {info.title_nepali}
                                                        </p>
                                                    )}
                                                </div>
                                            </Link>
                                            <div className="flex flex-col gap-1">
                                                <p className="text-[9px] font-black text-navy/30 uppercase tracking-widest">{new Date(ref.created_at).toLocaleDateString()}</p>
                                                <p className="text-[9px] font-mono text-navy/20">{new Date(ref.created_at).toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <div className="absolute -left-6 top-0 bottom-0 w-px bg-navy/10 print:bg-black/10 group-hover:bg-gold/40 transition-colors" />
                                            <div className="text-xl leading-relaxed whitespace-pre-wrap font-medium text-navy/80 italic first-letter:text-4xl first-letter:font-heading first-letter:not-italic first-letter:text-gold first-letter:float-left first-letter:mr-3 first-letter:mt-1 print:text-black print:opacity-100 print:visible">
                                                {ref.content}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Print styles */}
            <style jsx global>{`
                @media print {
                    @page { 
                        margin: 2cm;
                        size: auto;
                    }
                    html, body {
                        background-color: white !important;
                        -webkit-print-color-adjust: exact;
                        color: black !important;
                        height: auto !important;
                        overflow: visible !important;
                    }
                    /* Ensure all text is visible and layout is block */
                    * {
                        box-shadow: none !important;
                        text-shadow: none !important;
                        opacity: 1 !important;
                        visibility: visible !important;
                        transform: none !important;
                        transition: none !important;
                        animation: none !important;
                        position: static !important;
                    }
                    /* Restore necessary positioning */
                    .relative { position: relative !important; }
                    .absolute { position: absolute !important; }
                    .grid { display: grid !important; }
                    .flex { display: flex !important; }

                    .print\:hidden {
                        display: none !important;
                    }
                    .print\:no-underline {
                        text-decoration: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
