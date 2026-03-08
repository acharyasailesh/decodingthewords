"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { BookMarked, Save, Loader2, CheckCircle2 } from "lucide-react";

type ReflectionBoxProps = {
    chapterId: string;
    sectionTitle: string;
};

export default function ReflectionBox({ chapterId, sectionTitle }: ReflectionBoxProps) {
    const [content, setContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUserId(session.user.id);
                // Fetch existing reflection if any
                const { data } = await supabase
                    .from("user_reflections")
                    .select("content")
                    .eq("user_id", session.user.id)
                    .eq("chapter_id", chapterId)
                    .maybeSingle();
                
                if (data) {
                    // Don't show the auto-sync placeholder to the user
                    if (data.content !== "[Chapter Read]") {
                        setContent(data.content);
                    }
                }
            }
        };
        fetchInitialData();
    }, [chapterId]);

    const handleSave = async () => {
        if (!userId || !content.trim()) return;
        
        setIsSaving(true);
        setIsSaved(false);
        try {
            // Check if one exists
            const { data: existing } = await supabase
                .from("user_reflections")
                .select("id")
                .eq("user_id", userId)
                .eq("chapter_id", chapterId)
                .maybeSingle();

            if (existing) {
                await supabase
                    .from("user_reflections")
                    .update({ content: content })
                    .eq("id", existing.id);
            } else {
                await supabase
                    .from("user_reflections")
                    .insert([{ user_id: userId, chapter_id: chapterId, content: content }]);
            }
            
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
        } catch (error) {
            console.error("Error saving reflection", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!userId) return null; // Don't show to unauthenticated users

    // Generate a bilingual context-sensitive prompt based on section/chapter
    const getPrompt = () => {
        const prompts: Record<string, {en: string, np: string}> = {
            "ch-1": {
                en: "What core truth from your beginning journey resonated with you the most?",
                np: "तपाईको यात्राको सुरुवातको कुन मुख्य सत्यले तपाईलाई सबैभन्दा बढी छोयो?"
            },
            "ch-2": {
                en: "How clear is your primary objective after reading about destination clarity?",
                np: "गन्तव्य स्पष्टताको बारेमा पढेपछि तपाईको प्राथमिक उद्देश्य कत्तिको स्पष्ट छ?"
            },
            "ch-3": {
                en: "Which 'Social Trap' do you find yourself falling into most often?",
                np: "तपाईं प्रायः कुन 'सामाजिक जालो' मा फस्नुहुन्छ?"
            },
            "ch-4": {
                en: "What is the specific 'Language of Wealth' that you need to start speaking?",
                np: "तपाईले बोल्न सुरु गर्नुपर्ने 'धनको भाषा' (Language of Wealth) विशेष गरी के हो?"
            },
            "ch-5": {
                en: "After reading this, do you still believe your current problems are 'real' or just perceptions?",
                np: "यो पढेपछि, के तपाईं अझै पनि आफ्ना वर्तमान समस्याहरूलाई 'वास्तविक' ठान्नुहुन्छ वा केवल धारणा मात्र?"
            },
            "ch-6": {
                en: "What is one 'Correction' you need to make in your relationship with your problems?",
                np: "तपाईंले आफ्ना समस्याहरूसँगको सम्बन्धमा गर्नुपर्ने एउटा 'सुधार' (Correction) के हो?"
            },
            "ch-7": {
                en: "Who are the key people in your 'Sangat' that are influencing your growth?",
                np: "तपाईको 'संगत' मा तपाईको वृद्धिलाई प्रभाव पार्ने मुख्य व्यक्तिहरू को हुन्?"
            },
            "ch-8": {
                en: "How do you plan to start building your own 'Money Machine' today?",
                np: "तपाईं आजदेखि नै आफ्नै 'मनी मेसिन' (Money Machine) निर्माण गर्न कसरी योजना बनाउनुहुन्छ?"
            },
            "ch-9": {
                en: "What is the one step you will take immediately using the 'Do It Now' (DIN) principle?",
                np: "'तुरुन्तै गर' (DIN) सिद्धान्त प्रयोग गरेर तपाईंले तुरुन्तै चाल्ने कदम के हो?"
            },
            "ch-10": {
                en: "List three things from this chapter that you are truly grateful for right now.",
                np: "यस अध्यायबाट तपाईंले अहिले साँच्चै कृतज्ञ महसुस गर्नुभएका तीनवटा कुराहरू सूचीबद्ध गर्नुहोस्।"
            },
            "ch-11": {
                en: "How will you trust the 'Power of Process' when things get difficult?",
                np: "जब परिस्थिति कठिन हुन्छ, तपाईं 'प्रक्रियाको शक्ति' (Power of Process) मा कसरी विश्वास गर्नुहुन्छ?"
            },
            "ch-12": {
                en: "What kind of 'Harvest' are you expecting after applying these principles?",
                np: "यी सिद्धान्तहरू लागू गरेपछि तपाईं कस्तो प्रकारको 'प्रतिफल' (Harvest) को अपेक्षा गर्नुहुन्छ?"
            },
            "ch-13": {
                en: "How will you celebrate your success while keeping sight of new horizons?",
                np: "नयाँ क्षितिजहरूको छोजी गर्दै गर्दा तपाईं आफ्नो सफलताको उत्सव कसरी मनाउनुहुन्छ?"
            }
        };

        const sectionPrompts: Record<string, {en: string, np: string}> = {
            "wisdom": {
                en: "What deep wisdom did you uncover in this chapter?",
                np: "यस अध्यायमा तपाईंले कुन गहिरो ज्ञान पत्ता लगाउनुभयो?"
            },
            "observation": {
                en: "How can you apply this observation in your daily life?",
                np: "तपाईंले यो अवलोकनलाई आफ्नो दैनिक जीवनमा कसरी लागू गर्न सक्नुहुन्छ?"
            },
            "repetition": {
                en: "What specific habit will you practice based on this chapter?",
                np: "यस अध्यायको आधारमा तपाईंले कुन विशेष बानीको अभ्यास गर्नुहुनेछ?"
            },
            "discipline": {
                en: "What disciplined action will you take today to move forward?",
                np: "अगाडि बढ्नको लागि तपाईंले आज कुन अनुशासित कदम चाल्नुहुनेछ?"
            }
        };

        const specific = prompts[chapterId];
        if (specific) return specific;

        const lowSection = sectionTitle.toLowerCase();
        let fallback = {
            en: "Take a moment to write down your biggest takeaway from this chapter.",
            np: "यस अध्यायबाट तपाईंको सबैभन्दा ठूलो सिकाइ के हो, लेख्नुहोस्।"
        };

        if (lowSection.includes("wisdom")) fallback = sectionPrompts.wisdom;
        else if (lowSection.includes("observation")) fallback = sectionPrompts.observation;
        else if (lowSection.includes("repetition")) fallback = sectionPrompts.repetition;
        else if (lowSection.includes("discipline")) fallback = sectionPrompts.discipline;

        return fallback;
    };

    const prompt = getPrompt();

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="my-16 bg-navy/5 border border-navy/10 rounded-2xl overflow-hidden shadow-inner"
        >
            <div className="bg-navy p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <BookMarked className="w-5 h-5 text-gold" />
                    <h3 className="font-heading font-bold text-white tracking-widest uppercase text-sm">
                        Personal Reflection
                    </h3>
                </div>
                <div className="text-[10px] text-white/40 font-black uppercase tracking-widest">
                    Chapter Journal
                </div>
            </div>
            
            <div className="p-6 md:p-8 space-y-6">
                <div className="space-y-2 border-l-4 border-gold/30 pl-4">
                    <p className="text-navy font-bold text-xl leading-tight">
                        "{prompt.en}"
                    </p>
                    <p className="text-navy/50 font-nepali font-bold text-lg leading-relaxed italic">
                        "{prompt.np}"
                    </p>
                </div>
                
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type your thoughts here..."
                    className="w-full h-32 md:h-40 bg-white/50 border-2 border-navy/10 rounded-xl p-4 focus:ring-0 focus:border-gold transition-colors resize-none font-medium text-navy placeholder:text-navy/30"
                />
                
                <div className="flex justify-between items-center pt-2">
                    <p className="text-xs text-navy/50 font-medium">
                        Your entry will be saved to your Personal Journal.
                    </p>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !content.trim()}
                        className="flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-xl font-bold text-sm tracking-wide disabled:opacity-50 transition-all hover:bg-navy/90 hover:scale-105 active:scale-95"
                    >
                        {isSaving ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                        ) : isSaved ? (
                            <><CheckCircle2 className="w-4 h-4 text-green-400" /> Saved</>
                        ) : (
                            <><Save className="w-4 h-4" /> Save Journal</>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
