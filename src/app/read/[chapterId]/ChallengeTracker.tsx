"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
    CheckCircle2,
    Circle,
    Trophy,
    Loader2,
    Sparkles,
    TrendingUp,
    Calendar,
    Zap,
    Target,
    BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

const CHALLENGE_DAYS = [
    { day: 1, task: "ऐना हेरेर ५ मिनेट 'सुरु-वाद' गर्नुहोस् ।", category: "Wisdom" },
    { day: 2, task: "कुनै एउटा रोकिएको काममा '५ सेकेन्ड रुल' लगाउनुहोस् ।", category: "Observation" },
    { day: 3, task: "आफ्नो दैनिक कामका लागि बिहान योजना र बेलुका समीक्षा गर्ने काम सुरु गर्नुहोस् ।", category: "Repetition" },
    { day: 4, task: "आफ्नो घरको ढोकामा 'WELL-COME' को नियम लागू गर्नुहोस् ।", category: "Discipline" },
    { day: 5, task: "कसैको पनि इमानदार प्रशंसा गर्नुहोस् ।", category: "Wisdom" },
    { day: 6, task: "आफ्नो गन्तव्यको स्पष्टता र उद्देश्यको बोध, र आफूले दैनिक के गर्ने भनेर लेख्नुहोस् ।", category: "Observation" },
    { day: 7, task: "कसैको निस्वार्थ 'भला' गर्नुहोस् ।", category: "Repetition" },
    { day: 8, task: "९०% समस्या काल्पनिक हुन्छन् । तपाईंको समस्या काल्पनिक हो वा होइन विश्लेषण गर्नुहोस् ।", category: "Observation" },
    { day: 9, task: "कुनै सानो समस्यालाई तुरुन्तै सम्बोधन गर्नुहोस् ।", category: "Discipline" },
    { day: 10, task: "आफ्नो नकारात्मक शब्दहरू सकारात्मकमा बदल्नुहोस् ।", category: "Wisdom" },
    { day: 11, task: "कुनै नयाँ कुरा सिक्न सुरु गर्नुहोस् ।", category: "Repetition" },
    { day: 12, task: "ध्यान को ५ मिनेट अभ्यास गर्नुहोस् ।", category: "Discipline" },
    { day: 13, task: "आफ्नो काम गर्ने टेवल, कोठा वा ल्यापटपको डेस्कटप सफा गर्नुहोस् र नचाहिने कागज र फाइलहरू फ्याँक्नुहोस् ।", category: "Discipline" },
    { day: 14, task: "आफ्नो संगत मूल्याङ्कन गर्नुहोस् ।", category: "Observation" },
    { day: 15, task: "कुनै राम्रो पुस्तक वा प्रेरणादायी भिडियो हेर्नुहोस् ।", category: "Wisdom" },
    { day: 16, task: "आफ्नो एक डरको सामना गर्नुहोस् ।", category: "Wisdom" },
    { day: 17, task: "कृतज्ञताको लिस्ट बनाउनुहोस् ।", category: "Repetition" },
    { day: 18, task: "कुनै नयाँ बानी बनाउनको लागि लोसान्त लगाउनुहोस् ।", category: "Discipline" },
    { day: 19, task: "आफ्नो भावनाहरूको ट्र्याकिङ गर्नुहोस् ।", category: "Observation" },
    { day: 20, task: "आफ्नो सफलता मनाउनुहोस् र नयाँ 'सुरु-वात' गर्नुहोस् ।", category: "Wisdom" },
    { day: 21, task: "यस पुस्तकबाट सिकेको सबैभन्दा महत्वपूर्ण कुरा लेख्नुहोस् र अरूसँग साँझा गर्नुहोस् ।", category: "Repetition" },
];

export default function ChallengeTracker() {
    const [completedDays, setCompletedDays] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [streak, setStreak] = useState(0);

    useEffect(() => {
        const fetchProgress = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const { data } = await supabase
                .from("challenge_progress")
                .select("day_number")
                .eq("user_id", session.user.id)
                .eq("completed", true);

            if (data) {
                const completed = data.map(row => row.day_number);
                setCompletedDays(completed);
                calculateStreak(completed);
            }
            setLoading(false);
        };

        fetchProgress();
    }, []);

    const calculateStreak = (completed: number[]) => {
        if (completed.length === 0) return setStreak(0);
        const sorted = [...completed].sort((a, b) => a - b);
        let currentStreak = 0;
        let lastDay = 0;

        for (let i = 0; i < sorted.length; i++) {
            if (sorted[i] === lastDay + 1 || lastDay === 0) {
                currentStreak++;
                lastDay = sorted[i];
            } else {
                break;
            }
        }
        setStreak(currentStreak);
    };

    const toggleDay = async (day: number) => {
        if (saving) return;
        setSaving(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const isCompleted = completedDays.includes(day);

        if (!isCompleted) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#D4AF37', '#1A237E', '#FFFFFF']
            });
            
            // Insert or Update logic
            await supabase
                .from("challenge_progress")
                .upsert({ 
                    user_id: session.user.id, 
                    day_number: day, 
                    completed: true, 
                    completed_at: new Date().toISOString() 
                }, { onConflict: "user_id,day_number" });
                
            const newDays = [...completedDays, day];
            setCompletedDays(newDays);
            calculateStreak(newDays);
            
            if (newDays.length === 21) {
                triggerGrandFinale();
            }
        } else {
            // Delete logic (uncheck)
            await supabase
                .from("challenge_progress")
                .delete()
                .eq("user_id", session.user.id)
                .eq("day_number", day);
                
            const newDays = completedDays.filter(d => d !== day);
            setCompletedDays(newDays);
            calculateStreak(newDays);
        }

        setSaving(false);
    };

    const triggerGrandFinale = () => {
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    const progress = Math.round((completedDays.length / 21) * 100);

    // Stats for Chart
    const categories = ["Wisdom", "Observation", "Repetition", "Discipline"];
    const catStats = categories.map(cat => {
        const total = CHALLENGE_DAYS.filter(d => d.category === cat).length;
        const done = CHALLENGE_DAYS.filter(d => d.category === cat && completedDays.includes(d.day)).length;
        return { name: cat, percent: Math.round((done / total) * 100) };
    });

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-24 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-gold" />
            <p className="text-navy/40 font-medium animate-pulse">Syncing your progress...</p>
        </div>
    );

    return (
        <div className="space-y-12">
            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-navy rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl border border-gold/20 flex flex-col md:flex-row items-center gap-8">
                    <div className="relative w-40 h-40 shrink-0">
                        <svg className="w-full h-full -rotate-90">
                            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                            <motion.circle
                                cx="80" cy="80" r="70" stroke="#D4AF37" strokeWidth="8" fill="transparent"
                                strokeDasharray={440}
                                initial={{ strokeDashoffset: 440 }}
                                animate={{ strokeDashoffset: 440 - (440 * progress) / 100 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-mono font-bold text-gold">{progress}%</span>
                            <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Complete</span>
                        </div>
                    </div>

                    <div className="flex-1 space-y-4 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 bg-gold/10 text-gold px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                            <Sparkles className="w-3 h-3" />
                            Active Journey
                        </div>
                        <h3 className="text-[1.5em] font-heading font-bold">Decoding Challenge Dashboard</h3>
                        <p className="text-white/60 text-[0.85em] leading-relaxed max-w-sm">
                            You are currently on a {streak}-day streak! Keep decoding your thoughts to unlock your true potential.
                        </p>
                        <div className="flex justify-center md:justify-start gap-6 pt-2">
                            <div className="text-center">
                                <div className="text-xl font-bold text-white">{completedDays.length}</div>
                                <div className="text-[10px] uppercase text-white/40">Tasks Done</div>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div className="text-center">
                                <div className="text-xl font-bold text-white">{21 - completedDays.length}</div>
                                <div className="text-[10px] uppercase text-white/40">Remaining</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] p-6 border border-black/5 shadow-xl space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-black/30">Focus Areas</h4>
                        <BarChart3 className="w-4 h-4 text-gold" />
                    </div>
                    {catStats.map(cat => (
                        <div key={cat.name} className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-bold uppercase">
                                <span className="text-navy/60">{cat.name}</span>
                                <span className="text-gold">{cat.percent}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${cat.percent}%` }}
                                    className="h-full bg-navy/80"
                                />
                            </div>
                        </div>
                    ))}
                    <div className="pt-4 mt-4 border-t border-black/5">
                        <div className="flex items-center gap-3 p-3 bg-gold/5 rounded-xl border border-gold/10">
                            <Zap className="w-5 h-5 text-gold fill-gold" />
                            <div>
                                <div className="text-xs font-bold text-navy">Current Streak</div>
                                <div className="text-lg font-mono font-bold text-gold">{streak} Days</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-navy/40 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        21-Day Roadmap
                    </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {CHALLENGE_DAYS.map((item) => {
                        const isDone = completedDays.includes(item.day);
                        return (
                            <motion.div
                                key={item.day}
                                whileHover={{ scale: 1.01 }}
                                className={`relative group p-5 rounded-3xl border transition-all cursor-pointer overflow-hidden ${isDone
                                    ? "bg-navy text-white border-navy shadow-lg"
                                    : "bg-white border-black/5 hover:border-gold/30 shadow-sm"
                                    }`}
                                onClick={() => toggleDay(item.day)}
                            >
                                <div className={`absolute -right-4 -bottom-4 opacity-[0.03] transition-transform group-hover:scale-110 ${isDone ? "text-white" : "text-navy"}`}>
                                    {item.category === "Wisdom" && <Zap size={100} />}
                                    {item.category === "Observation" && <Target size={100} />}
                                    {item.category === "Repetition" && <TrendingUp size={100} />}
                                    {item.category === "Discipline" && <Target size={100} />}
                                </div>

                                <div className="flex gap-4 relative z-10">
                                    <div className="mt-1 shrink-0">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isDone ? "bg-gold text-navy" : "bg-offwhite text-navy/20"
                                            }`}>
                                            {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isDone ? "text-gold" : "text-black/30"}`}>
                                                Day {item.day} · {item.category}
                                            </span>
                                        </div>
                                        <p className={`font-nepali text-[1em] leading-relaxed ${isDone ? "text-white/90" : "text-navy"}`}>
                                            {item.task}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <AnimatePresence>
                {progress === 100 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="p-12 bg-gradient-to-br from-gold via-[#F2D06B] to-gold text-navy rounded-[3rem] text-center shadow-[0_20px_50px_rgba(212,175,55,0.3)] border-4 border-white/40 relative overflow-hidden"
                    >
                        <Trophy className="w-20 h-20 mx-auto mb-8 drop-shadow-xl animate-bounce" />
                        <h2 className="text-4xl font-heading font-black mb-4 tracking-tight">अदम्य साहस ! तपाईं एक 'डिकोडर' हुनुभयो !</h2>
                        <p className="font-bold text-xl text-navy/70 mb-10 max-w-xl mx-auto">
                            You have successfully mastered the 21-day challenge. Your subconscious is now rewired for greatness.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <button className="flex items-center justify-center gap-2 bg-navy text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl hover:scale-105 transition-transform">
                                <Sparkles className="w-5 h-5 text-gold" /> Download Certificate
                            </button>
                            <button className="flex items-center justify-center gap-2 bg-white text-navy px-8 py-4 rounded-2xl font-black text-sm shadow-lg hover:scale-105 transition-transform border border-navy/10">
                                Share Journey
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
