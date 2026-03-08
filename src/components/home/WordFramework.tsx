"use client";

import { motion } from "framer-motion";
import { Brain, Eye, Repeat, Activity } from "lucide-react";

export default function WordFramework() {
    const letters = [
        {
            initial: "W",
            title: "Wisdom",
            nepali: "बुद्धिमत्त",
            desc: "The power of choosing the right words",
            icon: <Brain className="w-8 h-8 text-navy" />
        },
        {
            initial: "O",
            title: "Observation",
            nepali: "अवलोकन",
            desc: "Watching how your words affect your body and confidence",
            icon: <Eye className="w-8 h-8 text-navy" />
        },
        {
            initial: "R",
            title: "Repetition",
            nepali: "दोहोऱ्याउने",
            desc: "Strengthening belief by repeating positive affirmations",
            icon: <Repeat className="w-8 h-8 text-navy" />
        },
        {
            initial: "D",
            title: "Discipline",
            nepali: "अनुशासन",
            desc: "Daily consistency in turning plans into action",
            icon: <Activity className="w-8 h-8 text-navy" />
        }
    ];

    return (
        <section className="py-24 bg-white">
            <div className="container mx-auto px-6 max-w-6xl">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl font-heading font-bold text-navy"
                    >
                        The W-O-R-D Framework
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-black/60 mt-4 max-w-2xl mx-auto text-lg font-nepali"
                    >
                        A four-step process to escape the social trap and transform your internal dialogue.
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {letters.map((item, idx) => (
                        <motion.div
                            key={item.initial}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.15 }}
                            whileHover={{ y: -5 }}
                            className="bg-offwhite rounded-3xl p-8 border border-sepia shadow-sm hover:shadow-lg hover:border-gold transition-all group"
                        >
                            <div className="w-16 h-16 bg-gold/20 rounded-2xl flex items-center justify-center text-3xl font-heading font-bold text-navy mb-6 group-hover:scale-110 transition-transform">
                                {item.initial}
                            </div>
                            <h3 className="text-2xl font-bold font-heading text-navy flex items-center gap-3">
                                {item.title}
                                <span className="text-gold-light text-base font-nepali mt-1">{item.nepali}</span>
                            </h3>
                            <p className="mt-4 text-black/70 font-medium">
                                {item.desc}
                            </p>
                            <div className="mt-6 flex justify-end opacity-20 group-hover:opacity-100 transition-opacity">
                                {item.icon}
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 }}
                    className="mt-20 bg-gradient-to-r from-navy to-gray-900 border border-gold/30 rounded-3xl p-10 text-center shadow-xl relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[url('/bg-pattern.svg')] opacity-5" />
                    <h3 className="relative z-10 text-2xl md:text-3xl font-heading font-bold text-white mb-2">
                        The Ultimate Equation
                    </h3>
                    <p className="relative z-10 text-xl font-bold font-mono tracking-widest text-gold mt-4 py-3 px-6 bg-white/5 inline-block rounded-xl border border-gold/20">
                        W.O.R.D + L <span className="text-white/40 text-sm font-sans tracking-normal">(Learning + Leverage)</span> = WORLD
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
