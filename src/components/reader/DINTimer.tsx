"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

type DINTimerProps = {
    chapterId: string;
};

export default function DINTimer({ chapterId }: DINTimerProps) {
    const [state, setState] = useState<"hidden" | "counting" | "input" | "saved">("hidden");
    const [timeLeft, setTimeLeft] = useState(5);
    const [actionText, setActionText] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const startTimer = () => {
        setState("counting");
        let current = 5;
        const interval = setInterval(() => {
            current -= 1;
            setTimeLeft(current);
            if (current <= 0) {
                clearInterval(interval);
                setState("input");
            }
        }, 1000);
    };

    const handleSave = async () => {
        if (!actionText.trim()) return;
        
        setIsSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await supabase
                    .from("din_actions")
                    .insert([{ 
                        user_id: session.user.id, 
                        chapter_id: chapterId, 
                        action_text: actionText 
                    }]);
            }
            setState("saved");
        } catch (error) {
            console.error("Error saving DIN action", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="my-10">
            <AnimatePresence mode="wait">
                {state === "hidden" && (
                    <motion.button
                        key="start-btn"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={startTimer}
                        className="w-full relative group overflow-hidden bg-gold/10 hover:bg-gold/20 border border-gold/30 rounded-2xl p-6 transition-all duration-300 flex flex-col items-center justify-center gap-3 cursor-pointer shadow-inner"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/10 to-gold/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                        <Timer className="w-8 h-8 text-gold" />
                        <div className="text-center">
                            <h3 className="font-heading font-black text-gold text-lg uppercase tracking-widest">
                                D.I.N. (Do It Now) Check
                            </h3>
                            <p className="text-sm font-medium opacity-70 mt-1">
                                Click to start the 5-second countdown before you read.
                            </p>
                        </div>
                    </motion.button>
                )}

                {state === "counting" && (
                    <motion.div
                        key="countdown"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.2 }}
                        className="w-full flex flex-col items-center justify-center p-10 bg-red-600/10 border-2 border-red-500/30 rounded-3xl"
                    >
                        <motion.span 
                            key={timeLeft}
                            initial={{ opacity: 0, y: 20, scale: 0.5 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 1.5 }}
                            className="font-heading font-black text-6xl md:text-8xl tracking-tighter text-red-500"
                        >
                            {timeLeft}
                        </motion.span>
                        <p className="mt-4 font-bold uppercase tracking-[0.2em] text-red-500/70 text-sm">
                            Get ready to act
                        </p>
                    </motion.div>
                )}

                {state === "input" && (
                    <motion.div
                        key="input-form"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full bg-navy border border-gold/30 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-gold to-green-500" />
                        
                        <h3 className="font-heading font-black text-white text-xl md:text-2xl mb-2">Time's Up! What will you do?</h3>
                        <p className="text-white/60 text-sm mb-6">Write down one immediate action you can take right now, before you continue reading.</p>
                        
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input 
                                type="text"
                                value={actionText}
                                onChange={(e) => setActionText(e.target.value)}
                                placeholder="I will commit to..."
                                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
                                autoFocus
                            />
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !actionText.trim()}
                                className="bg-gold text-navy font-black px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gold-light transition-all disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                                Commit
                            </button>
                        </div>
                    </motion.div>
                )}

                {state === "saved" && (
                    <motion.div
                        key="saved-state"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full flex items-center gap-4 bg-green-500/10 border border-green-500/30 rounded-2xl p-5 text-green-600 dark:text-green-400"
                    >
                        <CheckCircle2 className="w-6 h-6 shrink-0" />
                        <div>
                            <p className="font-bold">Action Committed</p>
                            <p className="text-sm opacity-80 truncate max-w-[250px] sm:max-w-sm">"{actionText}"</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
