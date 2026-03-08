"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Mail, MapPin, Facebook, Globe, Loader2 } from "lucide-react";

export default function WhoWeArePage() {
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

    const milestones = [
        { year: "2008", event: "Started career in software engineering in Nepal" },
        { year: "2012", event: "Co-founded first technology startup" },
        { year: "2015", event: "Completed MBA; expanded into business consultancy" },
        { year: "2018", event: "Established RKD Holdings Ltd. as Chairman" },
        { year: "2021", event: "Joined Tourism Investment Fund as Director" },
        { year: "2024", event: "Co-founded BizBazar Ltd. for digital commerce" },
        { year: "2026", event: "Published Decoding the Words (शब्दले संसार बदल्छ)" },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-offwhite">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-offwhite pt-40 pb-24">
            <div className="container mx-auto px-6 max-w-4xl">

                {/* Hero */}
                <div className="text-center mb-20">
                    <h1 className="text-4xl md:text-5xl font-heading font-bold text-navy mb-4">
                        Who We Are
                    </h1>
                    <p className="text-xl font-nepali text-black/60">
                        शब्दले संसार बदल्छ — The Story Behind the Book
                    </p>
                </div>

                {/* Author Card */}
                <div className="bg-navy text-white rounded-3xl overflow-hidden shadow-2xl mb-16">
                    <div className="grid md:grid-cols-5">
                        <div className="md:col-span-2 bg-gradient-to-b from-gold/30 to-navy/5 p-10 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-white/10">
                            <div className="w-28 h-28 rounded-full border-4 border-gold/40 bg-gold/10 overflow-hidden flex items-center justify-center mb-4 shadow-lg">
                                {author.image ? (
                                    <img src={author.image} alt={author.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl font-heading font-black text-gold">
                                        {author.name.split(" ").map(n => n[0]).join("").slice(-2)}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-2xl font-heading font-bold mb-1 text-white">{author.name}</h2>
                            <p className="text-white/60 text-sm font-medium mb-4">{author.experience} experience</p>
                            <div className="flex gap-3 mt-2">
                                <a href={author.facebook} target="_blank" rel="noopener noreferrer"
                                    className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-gold hover:text-navy transition-all">
                                    <Facebook className="w-4 h-4" />
                                </a>
                                <a href={`mailto:${author.email}`}
                                    className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-gold hover:text-navy transition-all">
                                    <Mail className="w-4 h-4" />
                                </a>
                                <a href={author.website} target="_blank" rel="noopener noreferrer"
                                    className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-gold hover:text-navy transition-all">
                                    <Globe className="w-4 h-4" />
                                </a>
                            </div>
                        </div>

                        <div className="md:col-span-3 p-10">
                            <h3 className="text-xl font-heading font-bold text-gold mb-5">About the Author</h3>
                            <div className="space-y-4 text-white/75 leading-relaxed font-nepali">
                                {author.description.split('\n').map((para, i) => (
                                    <p key={i}>{para}</p>
                                ))}
                            </div>

                            <div className="mt-6 grid grid-cols-1 gap-4">
                                {author.roles.map((role, i) => {
                                    const roleObj = typeof role === 'string' ? { text: role, link: '' } : role;
                                    return (
                                        <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/10 group transition-all hover:bg-white/10">
                                            {roleObj.link ? (
                                                <a href={roleObj.link} target="_blank" rel="noopener noreferrer" className="block w-full">
                                                    <p className="font-bold text-sm tracking-wide group-hover:text-gold transition-colors">{roleObj.text}</p>
                                                    <p className="text-[10px] text-white/30 mt-0.5 group-hover:text-gold/50 transition-colors uppercase font-bold tracking-widest flex items-center gap-1">
                                                        Visit Website <Globe className="w-3 h-3" />
                                                    </p>
                                                </a>
                                            ) : (
                                                <p className="font-bold text-sm tracking-wide">{roleObj.text}</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="mb-16">
                    <h2 className="text-2xl font-heading font-bold text-navy mb-8 text-center">Journey Timeline</h2>
                    <div className="relative">
                        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gold/20" />
                        <div className="space-y-6">
                            {milestones.map((m) => (
                                <div key={m.year} className="flex items-start gap-6 pl-4">
                                    <div className="w-8 h-8 rounded-full bg-gold text-navy flex items-center justify-center font-bold text-xs shrink-0 shadow-md relative z-10">
                                        {m.year.slice(2)}
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-black/5 flex-1 shadow-sm">
                                        <span className="text-xs font-bold text-gold tracking-wide">{m.year}</span>
                                        <p className="text-sm font-medium text-navy/80 mt-1">{m.event}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Contact Block */}
                <div className="bg-white rounded-3xl p-10 border border-black/5 shadow-sm">
                    <h2 className="text-2xl font-heading font-bold text-navy mb-6">Get in Touch</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <a href={`mailto:${author.email}`} className="flex items-start gap-4 p-5 rounded-2xl bg-offwhite hover:border-gold border border-transparent transition-all">
                            <Mail className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-navy text-sm">Email</p>
                                <p className="text-xs text-black/50 mt-0.5 break-all">{author.email}</p>
                            </div>
                        </a>
                        <a href={author.facebook} target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 p-5 rounded-2xl bg-offwhite hover:border-gold border border-transparent transition-all">
                            <Facebook className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-navy text-sm">Facebook</p>
                                <p className="text-xs text-black/50 mt-0.5">Profile</p>
                            </div>
                        </a>
                        <div className="flex items-start gap-4 p-5 rounded-2xl bg-offwhite border border-transparent">
                            <MapPin className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-navy text-sm">Location</p>
                                <p className="text-xs text-black/50 mt-0.5">Kathmandu, Nepal</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
