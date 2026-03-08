import type { Metadata } from "next";
import { Brain, Eye, Repeat, Activity, Plus } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
    title: "The W-O-R-D Framework | Decoding the Words",
    description: "Understand the complete W-O-R-D (Wisdom, Observation, Repetition, Discipline) framework from Decoding the Words by Er. Sailesh Acharya.",
};

const letters = [
    {
        letter: "W",
        titleEn: "Wisdom",
        titleNp: "बुद्धिमत्त",
        color: "from-blue-600 to-navy",
        icon: <Brain className="w-10 h-10" />,
        definition: "The power of consciously choosing the words you speak to yourself and others.",
        how: [
            "Replace 'I can't' with 'I am learning to'",
            "Replace 'I have to' with 'I choose to'",
            "Replace 'This is hard' with 'This builds me'",
        ],
        nepali: "आफूलाई र अरूलाई भन्ने शब्दहरू सचेत रूपमा छनोट गर्ने क्षमता।",
    },
    {
        letter: "O",
        titleEn: "Observation",
        titleNp: "अवलोकन",
        color: "from-amber-500 to-orange-600",
        icon: <Eye className="w-10 h-10" />,
        definition: "Watching and noticing how the words you choose physically affect your body, posture, and confidence level.",
        how: [
            "Notice when negative words create tension in your chest",
            "Observe your posture after positive affirmations",
            "Journal your physical reactions to your self-talk",
        ],
        nepali: "तपाईंले छनोट गर्ने शब्दहरूले तपाईंको शरीर र आत्मविश्वासमा कस्तो असर पार्छ भनेर ध्यान दिनुहोस्।",
    },
    {
        letter: "R",
        titleEn: "Repetition",
        titleNp: "दोहोऱ्याउने",
        color: "from-green-500 to-emerald-700",
        icon: <Repeat className="w-10 h-10" />,
        definition: "Strengthening your new belief system by consistently and deliberately repeating positive language patterns daily.",
        how: [
            "5 minutes of positive affirmations every morning",
            "Repeat your core belief statement before important decisions",
            "Write your intention 3 times before sleeping",
        ],
        nepali: "सकारात्मक भाषाका ढाँचाहरू दैनिक रूपले दोहोऱ्याएर नयाँ विश्वास प्रणाली निर्माण गर्नुहोस्।",
    },
    {
        letter: "D",
        titleEn: "Discipline",
        titleNp: "अनुशासन",
        color: "from-purple-600 to-indigo-800",
        icon: <Activity className="w-10 h-10" />,
        definition: "Taking consistent daily action that aligns with your new words and beliefs, even on days when motivation is absent.",
        how: [
            "Create non-negotiable daily micro-habits",
            "Act first, wait for motivation second",
            "Track your actions — not your feelings",
        ],
        nepali: "प्रेरणा नभए पनि आफ्ना नयाँ शब्द र विश्वाससँग मिल्दो दैनिक कदम उठाउनुहोस्।",
    },
];

export default function FrameworkPage() {
    return (
        <div className="min-h-screen bg-offwhite py-28">
            <div className="container mx-auto px-6 max-w-5xl">
                {/* Title Block */}
                <div className="text-center mb-20">
                    <div className="inline-block px-4 py-1.5 rounded-full border border-gold/30 bg-gold/10 text-navy font-semibold text-sm mb-4">
                        The Core System
                    </div>
                    <h1 className="text-5xl md:text-6xl font-heading font-bold text-navy mb-4 tracking-tight">
                        W-O-R-D
                    </h1>
                    <p className="text-xl text-black/60 max-w-2xl mx-auto font-medium">
                        A four-step transformational framework to escape the social trap and build a life of purpose.
                    </p>
                    <div className="mt-6 text-lg font-nepali text-black/40">
                        सामाजिक जालोबाट बाहिर निस्कने चार चरणको रूपान्तरण ढाँचा
                    </div>
                </div>

                {/* Framework Cards */}
                <div className="space-y-8">
                    {letters.map((item) => (
                        <div
                            key={item.letter}
                            className="bg-white rounded-3xl overflow-hidden border border-black/5 shadow-lg flex flex-col md:flex-row"
                        >
                            {/* Letter Sidebar */}
                            <div className={`bg-gradient-to-br ${item.color} md:w-48 p-8 flex flex-col items-center justify-center text-white shrink-0`}>
                                <div className="text-7xl font-heading font-black mb-2">{item.letter}</div>
                                <div className="text-lg font-bold text-white/90">{item.titleEn}</div>
                                <div className="text-sm text-white/60 font-nepali mt-1">{item.titleNp}</div>
                                <div className="mt-4 opacity-50">{item.icon}</div>
                            </div>

                            {/* Content */}
                            <div className="p-8 flex-1">
                                <p className="text-lg text-black/80 font-medium leading-relaxed mb-3">
                                    {item.definition}
                                </p>
                                <p className="text-sm font-nepali text-black/50 italic mb-6">
                                    {item.nepali}
                                </p>

                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-black/40 mb-3">
                                        How to Apply
                                    </p>
                                    <ul className="space-y-2">
                                        {item.how.map((h, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-black/70 font-medium">
                                                <span className="w-5 h-5 rounded-full bg-gold/15 text-gold flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                                    {i + 1}
                                                </span>
                                                {h}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Equation Block */}
                <div className="mt-16 bg-navy rounded-3xl p-10 text-center relative overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-[url('/bg-pattern.svg')] opacity-5 pointer-events-none" />
                    <h2 className="relative z-10 text-2xl font-heading font-bold text-white mb-6">
                        The Ultimate Equation
                    </h2>
                    <div className="relative z-10 inline-flex items-center gap-3 text-4xl font-mono font-bold text-gold">
                        <span>W.O.R.D</span>
                        <Plus className="w-8 h-8 text-white/30" />
                        <span>L</span>
                        <span className="text-white/30 text-2xl font-sans">=</span>
                        <span>WORLD</span>
                    </div>
                    <p className="relative z-10 text-white/50 mt-4 text-sm font-medium">
                        L = Learning + Leverage
                    </p>
                    <div className="relative z-10 mt-8">
                        <Link
                            href="/buy"
                            className="inline-flex items-center gap-2 bg-gold hover:bg-gold-light text-navy font-bold px-8 py-4 rounded-xl transition-all shadow-lg"
                        >
                            Read the Full Book — NPR 499
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
