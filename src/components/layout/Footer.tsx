"use client";

import Link from "next/link";
import { Facebook, Mail, Globe, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Footer() {
    const currentYear = new Date().getFullYear();
    const [settings, setSettings] = useState({
        facebook: "https://facebook.com/ersaileshacharya",
        email: "ersaileshacharya@gmail.com",
        website: "https://saileshacharya.com.np",
        authorName: "Er. Sailesh Acharya",
        description: "शब्दले संसार बदल्छ — तपाईंको शब्द, तपाईंको संसार। Master the practical application of Wisdom, Observation, Repetition, and Discipline to build the life you truly desire. By Er. Sailesh Acharya."
    });

    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase.from("settings").select("facebook_url, author_email, author_website, author_details").eq("id", 1).single();
            if (data) {
                setSettings({
                    facebook: data.facebook_url || "https://facebook.com/ersaileshacharya",
                    email: data.author_email || "ersaileshacharya@gmail.com",
                    website: data.author_website || "https://saileshacharya.com.np",
                    authorName: data.author_details?.name || "Er. Sailesh Acharya",
                    description: data.author_details?.description || "शब्दले संसार बदल्छ — तपाईंको शब्द, तपाईंको संसार। Master the practical application of Wisdom, Observation, Repetition, and Discipline to build the life you truly desire. By Er. Sailesh Acharya."
                });
            }
        };
        fetchSettings();
    }, []);

    return (
        <footer className="bg-navy pt-20 pb-10 border-t border-gold/20 text-white/70">
            <div className="container mx-auto px-6 max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

                    <div className="space-y-4 lg:col-span-2 pr-8">
                        <Link href="/" className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-full border-2 border-gold flex items-center justify-center text-white font-heading font-bold">
                                W
                            </div>
                            <span className="font-heading font-bold text-xl tracking-wide text-white">
                                Decoding <span className="text-gold">The Words</span>
                            </span>
                        </Link>
                        <p className="text-white/60 leading-relaxed font-nepali">
                            {settings.description}
                        </p>
                        <div className="flex gap-4 pt-4">
                            <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-gold hover:text-navy hover:border-gold transition-all">
                                <Facebook className="w-4 h-4" />
                            </a>
                            <a href={`mailto:${settings.email}`} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-gold hover:text-navy hover:border-gold transition-all">
                                <Mail className="w-4 h-4" />
                            </a>
                            <a href={settings.website} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-gold hover:text-navy hover:border-gold transition-all">
                                <Globe className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-heading font-bold text-white mb-6 uppercase tracking-wider text-sm">Navigation</h4>
                        <ul className="space-y-3 font-medium text-sm">
                            <li><Link href="/" className="hover:text-gold transition-colors">Home Page</Link></li>
                            <li><Link href="/framework" className="hover:text-gold transition-colors">W-O-R-D Framework</Link></li>
                            <li><Link href="/chapters-index" className="hover:text-gold transition-colors">Chapters Index</Link></li>
                            <li><Link href="/who-we-are" className="hover:text-gold transition-colors">Who We Are</Link></li>
                            <li><Link href="/success-stories" className="hover:text-gold transition-colors">Testimonials</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-heading font-bold text-white mb-6 uppercase tracking-wider text-sm">Support</h4>
                        <ul className="space-y-3 font-medium text-sm">
                            <li><Link href="/buy" className="hover:text-gold transition-colors">Buy The Book</Link></li>
                            <li><Link href="/login" className="hover:text-gold transition-colors">Member Login</Link></li>
                            <li><Link href="/contact" className="hover:text-gold transition-colors">Contact Support</Link></li>
                            <li><Link href="/privacy" className="hover:text-gold transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-gold transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40">
                    <p>© {currentYear} {settings.authorName}. All rights reserved.</p>
                    <p className="flex items-center gap-1 font-nepali">
                        Crafted with <Heart className="w-3 h-3 text-red-500 mx-1" /> from Nepal
                    </p>
                </div>
            </div>
        </footer>
    );
}
