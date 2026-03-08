"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Hero() {
    const [authorName, setAuthorName] = useState("Er. Sailesh Acharya");
    const [coverUrl, setCoverUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase.from("settings").select("author_details, book_cover_path").eq("id", 1).single();
            if (data?.author_details?.name) {
                setAuthorName(data.author_details.name);
            }
            if (data?.book_cover_path) {
                const { data: urlData } = supabase.storage.from("assets").getPublicUrl(data.book_cover_path);
                setCoverUrl(urlData.publicUrl);
            }
        };
        fetchSettings();
    }, []);

    return (
        <section className="relative overflow-hidden bg-navy pt-24 pb-32 lg:pt-36 lg:pb-40 text-white">
            {/* Background decorations */}
            <div className="absolute inset-0 bg-[url('/bg-pattern.svg')] opacity-10" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gold/20 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col gap-6"
                    >
                        <div className="inline-block w-fit px-4 py-1.5 rounded-full border border-gold/40 bg-gold/10 text-gold-light text-sm font-medium tracking-wide">
                            The Bestselling Nepali Motivational Book
                        </div>

                        <div className="flex items-center gap-1 mb-2 font-heading font-black text-2xl sm:text-3xl md:text-5xl tracking-widest text-white/90">
                            <motion.span initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>W</motion.span>
                            <motion.span initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>O</motion.span>
                            <motion.span initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.6 }}>R</motion.span>
                            <motion.span initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.8 }}>D</motion.span>
                            
                            <motion.div 
                                initial={{ opacity: 0, scale: 0, y: -20 }} 
                                animate={{ opacity: 1, scale: 1, y: 0 }} 
                                transition={{ duration: 0.7, delay: 1.5, type: "spring", bounce: 0.6 }}
                                className="flex items-center text-gold mx-2"
                            >
                                <span className="text-xl sm:text-2xl mr-2">+</span>
                                <span className="relative drop-shadow-[0_0_15px_rgba(255,191,0,0.8)]">L</span>
                            </motion.div>
                            
                            <motion.span 
                                initial={{ opacity: 0, width: 0 }} 
                                animate={{ opacity: 1, width: "auto" }} 
                                transition={{ duration: 0.5, delay: 2.2 }}
                                className="overflow-hidden flex items-center"
                            >
                                <span className="mx-2">=</span>
                                <span className="text-gold-light drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">WORLD</span>
                            </motion.span>
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold leading-tight font-heading text-white">
                            Decoding the Words <br />
                            <span className="text-gold mt-2 block font-nepali">शब्दले संसार बदल्छ</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-offwhite/80 font-nepali font-light">
                            तपाईंको शब्द, तपाईंको संसार
                        </p>

                        <p className="text-lg text-offwhite/70 max-w-lg mb-4">
                            Master the W-O-R-D framework to overcome self-doubt, beat procrastination, and turn your plans into reality. By {authorName}.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/buy" className="group flex items-center justify-center gap-2 bg-gold hover:bg-gold-light text-navy font-semibold px-8 py-4 rounded-xl transition-all shadow-lg shadow-gold/20">
                                Buy Now — Read Online
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link href="/read" className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-8 py-4 rounded-xl transition-all border border-white/10">
                                <BookOpen className="w-5 h-5" />
                                Read Free Preview
                            </Link>
                        </div>
                    </motion.div>

                    {/* Book Mockup Section */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative flex justify-center lg:justify-end"
                    >
                        <div className="relative w-full max-w-md aspect-[3/4] rounded-2xl bg-gradient-to-br from-gold to-navy shadow-2xl flex items-center justify-center border border-white/20 overflow-hidden group perspective-1000">
                            {coverUrl ? (
                                <div className="w-full h-full relative group-hover:rotate-y-12 transition-transform duration-700">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={coverUrl}
                                        alt="Book Cover"
                                        className="w-full h-full object-contain"
                                    />
                                    <div className="absolute inset-0 bg-navy/20 pointer-events-none" />
                                </div>
                            ) : (
                                <div className="w-11/12 h-[95%] bg-navy rounded-xl p-8 flex flex-col justify-between border border-gold/30 shadow-inner group-hover:rotate-y-12 transition-transform duration-700">
                                    <div className="text-center space-y-4">
                                        <h3 className="text-xl font-heading text-gold tracking-widest uppercase">{authorName}</h3>
                                        <div className="h-px w-16 bg-gold/50 mx-auto" />
                                        <h2 className="text-3xl font-heading font-bold mt-8">Decoding<br />The Words</h2>
                                        <h3 className="text-2xl font-nepali text-gold-light mt-4">शब्दले संसार<br />बदल्छ</h3>
                                    </div>
                                    <div className="text-center font-nepali text-sm text-white/50 border-t border-white/10 pt-4">
                                        तपाईंको शब्द, तपाईंको संसार
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
