"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, QrCode, Loader2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function PricingSection() {
    const [qrUrl, setQrUrl] = useState<string | null>(null);
    const [price, setPrice] = useState<number>(499);
    const [loadingQr, setLoadingQr] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase
                .from("settings")
                .select("qr_code_path, book_price")
                .eq("id", 1)
                .single();

            if (data?.qr_code_path) {
                const { data: urlData } = supabase.storage
                    .from("assets")
                    .getPublicUrl(data.qr_code_path);
                setQrUrl(urlData.publicUrl);
            }
            if (data?.book_price) setPrice(data.book_price);
            setLoadingQr(false);
        };
        fetchSettings();
    }, []);

    return (
        <section className="py-24 bg-white relative">
            <div className="container mx-auto px-6 max-w-4xl relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16"
                >
                    <div className="inline-block px-4 py-1.5 rounded-full border border-navy bg-navy/5 text-navy font-semibold text-sm mb-4">
                        Lifetime Digital License
                    </div>
                    <h2 className="text-4xl md:text-5xl font-heading font-bold text-navy">
                        Start Reading Today
                    </h2>
                    <p className="mt-4 text-black/60 font-medium text-lg max-w-xl mx-auto">
                        Get complete lifetime access to the interactive online reading platform.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="bg-navy rounded-3xl p-1 md:p-8 text-left shadow-2xl mx-auto overflow-hidden relative"
                >
                    {/* Subtle bg art */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-[80px]" />

                    <div className="bg-navy rounded-2xl p-6 md:p-10 border border-gold/20 flex flex-col md:flex-row gap-12 items-center relative z-10">
                        <div className="flex-1 w-full space-y-8">
                            <div>
                                <h3 className="text-3xl font-heading font-bold text-white">Full Digital Access</h3>
                                <div className="flex items-baseline gap-2 mt-4 text-gold">
                                    <span className="text-xl font-medium">NPR</span>
                                    <span className="text-5xl font-bold font-mono tracking-tighter">{price}</span>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/10">
                                <ul className="text-white/80 space-y-3 font-medium">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                                        Lifetime online reading access (No expiry)
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                                        Interactive 21-Day Challenge Tracker
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                                        Problem Solving Index Navigation
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                                        Progress saving & Bookmarking
                                    </li>
                                </ul>

                                <ul className="text-white/50 space-y-3 font-medium pt-3 mt-3 border-t border-white/5">
                                    <li className="flex items-start gap-3">
                                        <XCircle className="w-5 h-5 text-red-400/80 mt-0.5" />
                                        <span className="text-sm">No PDF or EPUB downloads</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <XCircle className="w-5 h-5 text-red-400/80 mt-0.5" />
                                        <span className="text-sm">No printing (Online reading only)</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* QR Code Panel */}
                        <div className="w-full md:w-80 shrink-0 bg-offwhite p-6 rounded-2xl flex flex-col items-center justify-center text-center shadow-inner">
                            <QrCode className="w-12 h-12 text-navy mb-4" />
                            <h4 className="font-bold text-navy text-lg leading-tight mb-4">
                                Scan to Pay via eSewa / Khalti / Mobile Banking
                            </h4>

                            <div className="w-48 h-48 rounded-xl overflow-hidden border border-black/10 bg-gray-100 flex items-center justify-center">
                                {loadingQr ? (
                                    <Loader2 className="w-8 h-8 text-navy/40 animate-spin" />
                                ) : qrUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={qrUrl}
                                        alt="Payment QR Code"
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <span className="text-black/40 text-sm font-medium px-4">
                                        QR Code<br />(Coming Soon)
                                    </span>
                                )}
                            </div>

                            <Link
                                href="/buy"
                                className="w-full mt-6 bg-gold hover:bg-gold-light text-navy font-bold py-4 px-6 rounded-xl transition-colors shadow-md text-sm cursor-pointer inline-flex justify-center items-center"
                            >
                                Submit Payment Screenshot
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
