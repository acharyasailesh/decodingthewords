"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Globe, Facebook, Award, Briefcase, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AuthorSection() {
    const [author, setAuthor] = useState({
        name: "Er. Sailesh Acharya",
        experience: "15+ Years",
        roles: [
            { text: "Chairman, RKD Holdings Ltd.", link: "https://rkdholdings.com" },
            { text: "Director, BizBazar Ltd.", link: "https://bizbazar.com.np" },
            { text: "Director, Tourism Investment Fund", link: "" }
        ] as (string | { text: string; link: string })[],
        description: "Decoding the Words is rooted in over a decade and a half of practical experience in technology, entrepreneurship, and continuous learning. The principles shared are not just theory—they are the exact disciplined steps used to build multiple successful ventures.",
        facebook: "https://facebook.com/ersaileshacharya",
        email: "ersaileshacharya@gmail.com",
        website: "https://saileshacharya.com.np",
        image: ""
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase.from("settings").select("*").eq("id", 1).single();
            if (data) {
                let imageUrl = "";
                if (data.author_image_path) {
                    const { data: urlData } = supabase.storage
                        .from("assets")
                        .getPublicUrl(data.author_image_path);
                    imageUrl = urlData.publicUrl;
                }

                setAuthor({
                    name: data.author_details?.name || "Er. Sailesh Acharya",
                    experience: data.author_details?.experience || "15+ Years",
                    roles: data.author_details?.roles || ["Chairman, RKD Holdings Ltd.", "Director, BizBazar Ltd.", "Director, Tourism Investment Fund"],
                    description: data.author_details?.description || "Decoding the Words is rooted in over a decade and a half of practical experience in technology, entrepreneurship, and continuous learning.",
                    facebook: data.facebook_url || "https://facebook.com/ersaileshacharya",
                    email: data.author_email || "ersaileshacharya@gmail.com",
                    website: data.author_website || "https://saileshacharya.com.np",
                    image: imageUrl
                });
            }
            setLoading(false);
        };
        fetchSettings();
    }, []);

    if (loading) {
        return (
            <div className="py-24 bg-sepia/20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
        );
    }

    return (
        <section className="py-24 bg-sepia/20 relative overflow-hidden">
            {/* Decorative bg blobs */}
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-navy/5 rounded-full blur-3xl pointer-events-none" />

            <div className="container mx-auto px-6 max-w-6xl relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col space-y-8"
                    >
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/30 bg-white text-navy font-semibold text-sm">
                                <Award className="w-4 h-4 text-gold" />
                                Meet the Author
                            </div>
                            <h2 className="text-4xl md:text-5xl font-heading font-bold text-navy">
                                {author.name}
                            </h2>
                            <p className="text-xl text-black/60 font-medium">{author.experience} Experience</p>
                        </div>

                        <p className="text-lg text-black/70 leading-relaxed font-nepali">
                            {author.description}
                        </p>

                        <div className="space-y-4 pt-4 border-t border-navy/10">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center text-white shrink-0 mt-1">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-navy text-lg">Current Roles</h4>
                                    <ul className="text-black/70 space-y-1 mt-2">
                                        {author.roles.map((role, i) => {
                                            const roleObj = typeof role === 'string' ? { text: role, link: '' } : role;
                                            return (
                                                <li key={i} className="flex items-center gap-2">
                                                    <ChevronRight className="w-4 h-4 text-gold" />
                                                    {roleObj.link ? (
                                                        <a href={roleObj.link} target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors hover:underline">
                                                            {roleObj.text}
                                                        </a>
                                                    ) : (
                                                        <span>{roleObj.text}</span>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 pt-4">
                            <a href={`mailto:${author.email}`} className="flex items-center gap-2 bg-white px-5 py-3 rounded-lg border border-black/5 hover:border-gold hover:shadow-md transition-all text-sm font-semibold text-navy">
                                <Mail className="w-4 h-4 text-gold" /> email me
                            </a>
                            <a href={author.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white px-5 py-3 rounded-lg border border-black/5 hover:border-gold hover:shadow-md transition-all text-sm font-semibold text-navy">
                                <Globe className="w-4 h-4 text-gold" /> website
                            </a>
                            <a href={author.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#1877F2]/10 px-5 py-3 rounded-lg border border-[#1877F2]/20 hover:bg-[#1877F2]/20 transition-all text-sm font-semibold text-[#1877F2]">
                                <Facebook className="w-4 h-4" /> Facebook
                            </a>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="relative"
                    >
                        <div className="aspect-[4/5] bg-navy rounded-3xl overflow-hidden shadow-2xl relative border-4 border-white group">
                            <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent to-transparent z-10 opacity-60" />

                            {author.image ? (
                                <img
                                    src={author.image}
                                    alt={author.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full bg-offwhite/50 flex flex-col items-center justify-center text-center p-8 relative hover:scale-105 transition-transform duration-700">
                                    <div className="w-24 h-24 border-2 border-gold rounded-full flex items-center justify-center mb-6">
                                        <span className="text-3xl font-heading text-navy">
                                            {author.name.split(" ").map(n => n[0]).join("").slice(-2)}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-bold font-heading text-navy mb-2">{author.name}</h3>
                                    <p className="text-black/60 font-medium whitespace-pre-line">
                                        {author.roles.slice(0, 3).map(r => typeof r === 'string' ? r : r.text).join(" • ")}
                                    </p>
                                </div>
                            )}

                            <div className="absolute bottom-10 inset-x-10 z-20">
                                <p className="text-sm font-nepali text-white text-center">तपाईंको शब्द, तपाईंको संसार</p>
                            </div>
                        </div>
                        {/* Floating accent block */}
                        <div className="absolute -bottom-6 -left-6 bg-gold text-white p-6 rounded-2xl shadow-xl w-48 rotate-[-5deg]">
                            <p className="font-heading font-bold text-xl leading-tight">{author.experience}</p>
                            <p className="text-white/80 text-sm font-medium mt-1">of industry impact</p>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
