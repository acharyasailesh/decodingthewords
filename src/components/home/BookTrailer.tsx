"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play, Film } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function BookTrailer() {
    const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase.from("settings").select("book_trailer_url").eq("id", 1).single();
            if (data?.book_trailer_url) {
                setTrailerUrl(data.book_trailer_url);
            }
        };
        fetchSettings();
    }, []);

    const getEmbedUrl = (url: string) => {
        if (!url) return null;
        
        // YouTube
        const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
        if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;

        // Vimeo
        const vimeoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/)([0-9]+)/);
        if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;

        return url;
    };

    if (!trailerUrl) return null;

    const embedUrl = getEmbedUrl(trailerUrl);

    return (
        <section className="py-24 bg-white overflow-hidden">
            <div className="container mx-auto px-6 max-w-5xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-navy/10 bg-offwhite text-navy font-bold text-xs uppercase tracking-widest mb-4">
                        <Film className="w-3.5 h-3.5 text-gold" />
                        Official Book Trailer
                    </div>
                    <h2 className="text-3xl md:text-5xl font-heading font-bold text-navy">
                        Experience the Journey
                    </h2>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative aspect-video rounded-3xl overflow-hidden bg-navy shadow-2xl border-4 border-white group"
                >
                    {!isPlaying ? (
                        <div 
                            className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer"
                            onClick={() => setIsPlaying(true)}
                        >
                            {/* Overlay/Thumbnail placeholder if we had one, but using a gradient for now */}
                            <div className="absolute inset-0 bg-gradient-to-br from-navy/80 to-navy opacity-60 group-hover:opacity-40 transition-opacity" />
                            
                            <div className="relative z-20 w-20 h-20 rounded-full bg-gold text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                                <Play className="w-8 h-8 fill-current ml-1" />
                            </div>
                            
                            <div className="absolute bottom-8 left-8 right-8 z-20 text-center">
                                <p className="text-white font-heading font-bold text-xl drop-shadow-lg">Watch the Trailer</p>
                            </div>
                        </div>
                    ) : (
                        <iframe
                            src={embedUrl || ""}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    )}
                </motion.div>
            </div>
        </section>
    );
}
