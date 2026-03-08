"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
    ChevronLeft,
    ChevronRight,
    Loader2,
    Home,
    Settings2,
    X,
    ArrowUp,
    Clock,
    BookOpen,
    Sun,
    Moon,
    Coffee,
    Type,
    AlignJustify,
    BookText,
    BookMarked
} from "lucide-react";
import Link from "next/link";
import ChallengeTracker from "./ChallengeTracker";
import ReflectionBox from "@/components/reader/ReflectionBox";
import DINTimer from "@/components/reader/DINTimer";
import FrameworkSidebar from "@/components/reader/FrameworkSidebar";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

type Block = {
    type: "paragraph" | "heading" | "quote" | "image" | "list" | "diary";
    content: string;
    language?: "english" | "nepali" | "bilingual" | "preeti" | "times";
};

type Chapter = {
    chapter_id: string;
    section_id: string;
    title_english: string;
    title_nepali: string;
    content_blocks: Block[];
    order_index: number;
    is_preview: boolean;
};

type ReaderModeProps = {
    chapterId: string;
};

// Estimate reading time (words per min)
function estimateReadTime(blocks: Block[]): number {
    const text = blocks.map((b) => b.content).join(" ");
    const words = text.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
}

const THEMES = [
    { id: "light" as const, label: "Light", icon: Sun, bg: "bg-white", fg: "text-navy" },
    { id: "sepia" as const, label: "Sepia", icon: Coffee, bg: "bg-[#FBF0D9]", fg: "text-[#5F4B32]" },
    { id: "dark" as const, label: "Dark", icon: Moon, bg: "bg-[#141920]", fg: "text-gray-200" },
];

export default function ReaderMode({ chapterId }: ReaderModeProps) {
    const router = useRouter();
    const [chapter, setChapter] = useState<Chapter | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState("");
    const [showSettings, setShowSettings] = useState(false);
    const [fontSize, setFontSize] = useState<"small" | "medium" | "large">("medium");
    const [lineHeight, setLineHeight] = useState<"compact" | "relaxed" | "spacious">("relaxed");
    const [theme, setTheme] = useState<"light" | "sepia" | "dark">("light");
    const [sectionTitle, setSectionTitle] = useState("");
    const [adjacentChapters, setAdjacentChapters] = useState<{
        prev: string | null;
        next: string | null;
    }>({ prev: null, next: null });
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [readTime, setReadTime] = useState(0);
    const [pageTransition, setPageTransition] = useState(false);
    const [direction, setDirection] = useState<number>(0);
    const searchParams = useSearchParams();
    const enterDir = searchParams.get("dir");
    const settingsRef = useRef<HTMLDivElement>(null);
    const settingsBtnRef = useRef<HTMLButtonElement>(null);

    const contentRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

    // Load stored preferences
    useEffect(() => {
        const saved = localStorage.getItem("reader-prefs");
        if (saved) {
            try {
                const prefs = JSON.parse(saved);
                if (prefs.theme) setTheme(prefs.theme);
                if (prefs.fontSize) setFontSize(prefs.fontSize);
                if (prefs.lineHeight) setLineHeight(prefs.lineHeight);
            } catch {
                // ignore
            }
        }
    }, []);

    // Save preferences
    const savePrefs = (updates: object) => {
        const saved = localStorage.getItem("reader-prefs");
        const prefs = saved ? JSON.parse(saved) : {};
        localStorage.setItem("reader-prefs", JSON.stringify({ ...prefs, ...updates }));
    };

    // Close settings on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                settingsRef.current &&
                !settingsRef.current.contains(e.target as Node) &&
                settingsBtnRef.current &&
                !settingsBtnRef.current.contains(e.target as Node)
            ) {
                setShowSettings(false);
            }
        };
        if (showSettings) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showSettings]);

    // Scroll to top button
    useEffect(() => {
        const handleScroll = () => setShowScrollTop(window.scrollY > 600);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const fetchChapter = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch chapter data

            // 1. Fetch chapter data first to check is_preview
            const { data: chData, error: chError } = await supabase
                .from("book_content")
                .select("*")
                .eq("chapter_id", chapterId)
                .single();



            if (chError || !chData) {
                setError(`Chapter not found: ${chapterId}. Please check the URL.`);
                setLoading(false);
                return;
            }

            const currentChapter = chData as Chapter;

            // --- Synchronization: Mark as Read & Auth ---
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.user) {
                const { data: existing } = await supabase
                    .from("user_reflections")
                    .select("id")
                    .eq("user_id", session.user.id)
                    .eq("chapter_id", chapterId)
                    .maybeSingle();

                if (!existing) {
                    await supabase
                        .from("user_reflections")
                        .insert([{ 
                            user_id: session.user.id, 
                            chapter_id: chapterId, 
                            content: "[Chapter Read]" 
                        }]);
                }
            }

            const isPreview = Boolean(chData.is_preview === true || chData.is_public_preview === true);

            // Guests can read previews — only redirect for premium chapters
            if (!session && !isPreview) {
                alert(`DEBUG: Redirecting to login. session=${!!session} isPreview=${isPreview} is_preview_raw=${chData.is_preview}`);
                router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
                return;
            }

            // If logged in, but not an admin and not licensed and not a preview
            if (!isPreview && session) {
                const { data: userData } = await supabase
                    .from("users")
                    .select("has_license, role")
                    .eq("id", session.user.id)
                    .single();

                if (userData && !userData.has_license && userData.role !== 'admin') {
                    setError("This chapter is premium content. Please activate your license to read.");
                    setLoading(false);
                    return;
                }
            }

            setEmail(session?.user?.email || "Guest Reader");
            setChapter(currentChapter);

            if (currentChapter.content_blocks?.length) {
                setReadTime(estimateReadTime(currentChapter.content_blocks));
            }

            const { data: settingsData } = await supabase
                .from("settings")
                .select("book_sections")
                .eq("id", 1)
                .single();
            const sections = settingsData?.book_sections || [];
            const sec = sections.find((s: { id: string }) => s.id === currentChapter.section_id);
            if (sec) setSectionTitle((sec as { titleEn: string }).titleEn);

            const { data: allChapters } = await supabase
                .from("book_content")
                .select("chapter_id, order_index")
                .order("order_index", { ascending: true });

            if (allChapters) {
                const currentIndex = allChapters.findIndex((c) => c.chapter_id === chapterId);
                setAdjacentChapters({
                    prev: currentIndex > 0 ? allChapters[currentIndex - 1].chapter_id : null,
                    next:
                        currentIndex < allChapters.length - 1
                            ? allChapters[currentIndex + 1].chapter_id
                            : null,
                });
            }
        } catch (err) {
            console.error(err);
            setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    }, [chapterId, router]);

    useEffect(() => {
        fetchChapter();
        window.scrollTo(0, 0);
    }, [fetchChapter]);

    // Anti-piracy
    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => e.preventDefault();
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                (e.ctrlKey || e.metaKey) &&
                ["c", "p", "s", "a"].includes(e.key.toLowerCase())
            ) {
                e.preventDefault();
                alert("Action disabled for copyright protection.");
            }
        };
        document.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    // Navigate with transition
    const navigateTo = (id: string, dir: "prev" | "next") => {
        setDirection(dir === "next" ? 1 : -1);
        setPageTransition(true);
        setTimeout(() => {
            router.push(`/read/${id}?dir=${dir === "next" ? "n" : "p"}`);
        }, 400);
    };

    // Theme vars
    const T = {
        light: {
            bg: "bg-white",
            text: "text-navy",
            nav: "bg-white/90 border-black/8 text-navy",
            settings: "bg-white border-black/10 text-navy",
            quote: "bg-black/[0.03] border-gold",
            heading: "text-navy",
            progress: "bg-gold",
            pageNum: "text-navy/30",
            subtext: "text-navy/50",
            divider: "bg-navy/10",
        },
        sepia: {
            bg: "bg-[#FBF0D9]",
            text: "text-[#5F4B32]",
            nav: "bg-[#F4E2C7]/95 border-[#DECBAF] text-[#5F4B32]",
            settings: "bg-[#FBF0D9] border-[#DECBAF] text-[#5F4B32]",
            quote: "bg-[#F4E2C7] border-[#B8860B]",
            heading: "text-[#3D2B1F]",
            progress: "bg-[#B8860B]",
            pageNum: "text-[#5F4B32]/30",
            subtext: "text-[#5F4B32]/50",
            divider: "bg-[#5F4B32]/10",
        },
        dark: {
            bg: "bg-[#141920]",
            text: "text-gray-300",
            nav: "bg-[#141920]/95 border-white/8 text-gray-200",
            settings: "bg-[#1E2630] border-white/10 text-gray-200",
            quote: "bg-white/[0.04] border-gold",
            heading: "text-white",
            progress: "bg-gold",
            pageNum: "text-white/20",
            subtext: "text-white/40",
            divider: "bg-white/8",
        },
    };
    const tc = T[theme];

    const getFontSizeValue = () => {
        if (fontSize === "small") return "16px";
        if (fontSize === "large") return "48px";
        return "26px";
    };

    const getLineHeightValue = () => {
        if (lineHeight === "compact") return "1.2";
        if (lineHeight === "spacious") return "2.8";
        return "2.0";
    };

    const parseMixedContent = (content: string, baseClass: string) => {
        if (!content) return null;

        // Glue punctuation (purna biram, !, ?, etc) to previous word to prevent dangling on new line
        // We use \u00A0 (non-breaking space)
        const gluedContent = content.replace(/ (।|!|\?|:|;)/g, '\u00A0$1');

        // If it looks like HTML, render it as HTML
        if (content.includes("<") && content.includes(">")) {
            return (
                <span
                    className={`${baseClass} rich-text-content`}
                    dangerouslySetInnerHTML={{ __html: gluedContent }}
                />
            );
        }
        return <span className={baseClass}>{gluedContent}</span>;
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className={`h-screen flex flex-col items-center justify-center gap-6 ${tc.bg}`}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                >
                    <Loader2 className="w-10 h-10 text-gold" />
                </motion.div>
                <motion.p
                    animate={{ opacity: [0.4, 0.9, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`text-sm font-semibold uppercase tracking-widest ${tc.subtext}`}
                >
                    Loading chapter…
                </motion.p>
            </div>
        );
    }

    // ── Error ────────────────────────────────────────────────────────────────
    if (error || !chapter) {
        return (
            <div className={`min-h-screen ${tc.bg} flex items-center justify-center text-center p-6 transition-colors duration-500`}>
                <div className="max-w-md w-full bg-white/[0.03] backdrop-blur-2xl rounded-[2.5rem] p-12 text-center border border-white/10 shadow-2xl relative z-10">
                    <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                        <X className="w-10 h-10 text-red-400" />
                    </div>
                    <h2 className={`text-3xl font-heading font-black mb-4 ${tc.heading}`}>
                        Unable to Open
                    </h2>
                    <p className={`${tc.subtext} font-medium mb-10 leading-relaxed`}>{error || "This chapter is currently unavailable."}</p>
                    <div className="flex flex-col gap-4">
                        <Link
                            href="/read"
                            className="bg-gold text-navy font-black py-4 px-8 rounded-2xl transition-all hover:scale-[1.02] shadow-[0_10px_30px_rgba(184,134,11,0.3)]"
                        >
                            Back to Library
                        </Link>
                        <Link href="/login" className={`${tc.text} opacity-50 hover:opacity-100 font-bold text-sm transition-colors py-2`}>
                            Sign in for Full Access
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const isNepaliBlock = (block: Block) => {
        const lang = block.language?.toLowerCase();
        return (
            lang === "nepali" ||
            lang === "preeti" ||
            lang === "times"
        );
    };

    const getBlockBaseClass = (block: Block) => {
        const lang = block.language?.toLowerCase();
        if (lang === "preeti") return "font-preeti text-[1.3em]";
        if (lang === "nepali") return "font-nepali text-[1.15em]";
        if (lang === "times") return "font-times text-[1.15em]";
        return "";
    };

    // Animation variants for page turn
    const pageVariants: any = {
        initial: (dir: string | null) => {
            if (dir === "n") return { x: "120%", rotateY: 45, opacity: 0, scale: 0.9 };
            if (dir === "p") return { x: "-120%", rotateY: -45, opacity: 0, scale: 0.9 };
            return { opacity: 0, scale: 0.98 };
        },
        animate: { x: 0, rotateY: 0, opacity: 1, scale: 1 },
        exit: (dir: number) => {
            if (dir > 0) return { x: "-120%", rotateY: -45, opacity: 0, scale: 0.9, transition: { duration: 0.5, ease: "circIn" } };
            if (dir < 0) return { x: "120%", rotateY: 45, opacity: 0, scale: 0.9, transition: { duration: 0.5, ease: "circIn" } };
            return { opacity: 0, transition: { duration: 0.3 } };
        }
    };

    return (
        <>
            {/* ── Reading Progress Bar (Fixed outside AnimatePresence and transforms) ── */}
            <motion.div
                key="progress-bar"
                className={`fixed top-0 left-0 right-0 h-[4.5px] origin-left z-[100] ${tc.progress}`}
                style={{ scaleX }}
            />

            {/* ── Top Navigation (Fixed outside AnimatePresence) ──────────────── */}
            <div
                className={`fixed top-0 inset-x-0 h-[60px] border-b z-[90] flex items-center justify-between px-5 lg:px-10 backdrop-blur-md transition-colors duration-300 ${tc.nav}`}
                style={{ marginTop: "4.5px" }}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <Link
                        href="/"
                        title="Website Homepage"
                        className="shrink-0 p-2 rounded-xl hover:bg-black/5 transition-colors"
                    >
                        <Home className="w-4 h-4" />
                    </Link>
                    <Link
                        href="/read"
                        title="Back to Library"
                        className="shrink-0 p-2 rounded-xl hover:bg-black/5 transition-colors"
                    >
                        <BookOpen className="w-4 h-4" />
                    </Link>
                    <Link
                        href="/diary"
                        title="Sameer's Diary Thread"
                        className="shrink-0 p-2 rounded-xl hover:bg-black/5 transition-colors"
                    >
                        <BookText className="w-4 h-4 text-gold" />
                    </Link>
                    <Link
                        href="/journal"
                        title="My Personal Journal"
                        className="shrink-0 p-2 rounded-xl hover:bg-black/5 transition-colors"
                    >
                        <BookMarked className="w-4 h-4 text-gold" />
                    </Link>
                    <span className={`w-px h-4 ${tc.divider}`} />
                    <span className="font-heading font-bold text-sm truncate max-w-[160px] md:max-w-xs">
                        {chapter.title_english}
                    </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {readTime > 0 && (
                        <span className={`hidden sm:flex items-center gap-1 text-xs font-semibold mr-3 ${tc.subtext}`}>
                            <Clock className="w-3.5 h-3.5" />
                            {readTime} min read
                        </span>
                    )}
                    <button
                        ref={settingsBtnRef}
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2 rounded-xl transition-colors ${showSettings ? "bg-gold/10 text-gold" : "hover:bg-black/5"}`}
                    >
                        <Settings2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ── Settings Panel (Fixed outside AnimatePresence) ──────────────── */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        ref={settingsRef}
                        initial={{ opacity: 0, y: -10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.97 }}
                        transition={{ duration: 0.2 }}
                        className={`fixed top-[67px] right-4 lg:right-8 w-72 rounded-2xl shadow-2xl border p-5 z-[100] ${tc.settings}`}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <p className="text-xs font-black uppercase tracking-widest opacity-40">
                                Reading Preferences
                            </p>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="w-6 h-6 rounded-full hover:bg-black/10 flex items-center justify-center transition-colors opacity-40"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="space-y-5">
                            {/* Theme */}
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2.5 flex items-center gap-1.5">
                                    <Sun className="w-3 h-3" /> Theme
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    {THEMES.map((t) => {
                                        const Icon = t.icon;
                                        return (
                                            <button
                                                key={t.id}
                                                onClick={() => {
                                                    setTheme(t.id);
                                                    savePrefs({ theme: t.id });
                                                }}
                                                className={`py-2.5 px-2 text-[11px] font-bold rounded-xl border flex flex-col items-center gap-1.5 transition-all ${t.bg} ${t.fg} ${theme === t.id
                                                    ? "border-gold ring-2 ring-gold/30 shadow-md"
                                                    : "border-black/10"
                                                    }`}
                                            >
                                                <Icon className="w-3.5 h-3.5" />
                                                {t.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Font Size */}
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2.5 flex items-center gap-1.5">
                                    <Type className="w-3 h-3" /> Text Size
                                </p>
                                <div className="grid grid-cols-3 gap-3">
                                    {(["small", "medium", "large"] as const).map((s, i) => (
                                        <button
                                            key={s}
                                            onClick={() => {
                                                setFontSize(s);
                                                savePrefs({ fontSize: s });
                                            }}
                                            className={`py-3.5 px-2 font-black rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 ${fontSize === s
                                                ? "border-gold ring-2 ring-gold/30 bg-gold/10 text-gold shadow-lg"
                                                : "border-black/5 hover:opacity-100"
                                                }`}
                                        >
                                            <span style={{ fontSize: `${11 + i * 4}px` }} className="leading-none mb-1">Aa</span>
                                            <span className="text-[8px] opacity-40 uppercase tracking-tighter">{s}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Line Height */}
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2.5 flex items-center gap-1.5">
                                    <AlignJustify className="w-3 h-3" /> Spacing
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    {(["compact", "relaxed", "spacious"] as const).map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => {
                                                setLineHeight(s);
                                                savePrefs({ lineHeight: s });
                                            }}
                                            className={`py-2 text-[11px] font-bold tracking-wider rounded-xl border capitalize transition-all ${lineHeight === s
                                                ? "border-gold ring-2 ring-gold/30 bg-gold/10 text-gold shadow-[0_0_15px_rgba(184,134,11,0.2)]"
                                                : "border-black/10 hover:bg-black/5"
                                                }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence custom={direction} mode="wait">
                <motion.div
                    key={chapterId}
                    custom={enterDir}
                    variants={pageVariants}
                    initial="initial"
                    animate={pageTransition ? "exit" : "animate"}
                    exit="exit"
                    transition={{
                        x: { type: "spring", stiffness: 260, damping: 30 },
                        rotateY: { duration: 0.5 },
                        opacity: { duration: 0.3 }
                    }}
                    className={`min-h-screen transition-colors duration-500 relative select-none perspective-2000 ${tc.bg} ${tc.text}`}
                    style={{
                        WebkitUserSelect: "none",
                        userSelect: "none",
                        transformStyle: "preserve-3d",
                        overflowX: "hidden",
                        overflowY: "visible"
                    } as React.CSSProperties}
                >
                    {/* ── Page Turn Shimmer Shadow Effect ───────────────────────────────── */}
                    <AnimatePresence>
                        {pageTransition && (
                            <motion.div
                                initial={{ x: direction > 0 ? "100%" : "-100%" }}
                                animate={{ x: direction > 0 ? "-100%" : "100%" }}
                                transition={{ duration: 0.6, ease: "easeInOut" }}
                                className="fixed inset-0 z-[70] pointer-events-none"
                                style={{
                                    background: `linear-gradient(${direction > 0 ? "90deg" : "270deg"}, transparent, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 60%, transparent)`
                                }}
                            />
                        )}
                    </AnimatePresence>

                    {/* ── Interactive Framework Sidebar ──────────────────────────── */}
                    <FrameworkSidebar sectionId={chapter.section_id} />

                    {/* ── Watermark ──────────────────────────────────────────────── */}
                    <div className="fixed inset-0 pointer-events-none opacity-[0.018] z-50 overflow-hidden flex items-center">
                        <div
                            className="text-3xl font-bold font-mono tracking-widest whitespace-nowrap rotate-[-25deg] translate-y-[-50%] w-[300%]"
                            style={{ color: theme === "dark" ? "white" : "black" }}
                        >
                            {Array(30)
                                .fill(`${email} • LICENSED COPY`)
                                .join("   ")}
                        </div>
                    </div>

                    {/* Ambient reading column glow (light/sepia only) */}
                    {theme !== "dark" && (
                        <div className="pointer-events-none fixed inset-y-0 left-0 right-0 z-0">
                            <div className="max-w-[680px] mx-auto h-full relative">
                                <div className="absolute inset-y-0 -left-20 w-24 bg-gradient-to-r from-gold/[0.04] to-transparent" />
                                <div className="absolute inset-y-0 -right-20 w-24 bg-gradient-to-l from-gold/[0.04] to-transparent" />
                            </div>
                        </div>
                    )}

                    <style jsx global>{`
                        .rich-text-content table {
                            border-collapse: collapse;
                            table-layout: fixed;
                            width: 100%;
                            margin: 1.5em 0;
                            border: 1px solid currentColor;
                            opacity: 0.8;
                        }
                        .rich-text-content td, .rich-text-content th {
                            border: 1px solid currentColor;
                            padding: 12px 16px;
                            vertical-align: top;
                        }
                        .rich-text-content th {
                            background: rgba(184, 134, 11, 0.1);
                            font-weight: 900;
                            text-transform: uppercase;
                            font-size: 0.8em;
                            letter-spacing: 0.1em;
                        }
                        .rich-text-content p, .rich-text-content {
                            margin: 0;
                            white-space: pre-wrap !important;
                            text-align: justify !important;
                            text-justify: inter-word !important;
                        }
                        article > div {
                            white-space: pre-wrap !important;
                            text-align: justify !important;
                            text-justify: inter-word !important;
                        }
                        /* List items and quotes should also preserve whitespace */
                        article blockquote, article li {
                            white-space: pre-wrap !important;
                        }
                        .rich-text-content b, .rich-text-content strong {
                            font-weight: 800;
                        }
                        .rich-text-content u {
                            text-decoration: underline;
                            text-decoration-thickness: 2px;
                            text-underline-offset: 4px;
                        }
                        .rich-text-content i, .rich-text-content em {
                            font-style: italic;
                            opacity: 0.9;
                        }
                        .diary-content, .diary-content p, .diary-content span {
                            text-align: justify !important;
                            text-justify: inter-word !important;
                        }
                    `}</style>

                    <main
                        ref={contentRef}
                        className="relative z-10 pt-28 pb-44 px-6 max-w-[800px] mx-auto transition-all duration-700 ease-in-out"
                        style={{
                            "--reader-font-size": getFontSizeValue(),
                            "--reader-line-height": getLineHeightValue(),
                            fontSize: "var(--reader-font-size)",
                            lineHeight: "var(--reader-line-height)"
                        } as React.CSSProperties}
                    >
                        {/* Chapter Header */}
                        <motion.header
                            initial={{ opacity: 0, y: 30, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="mb-20 text-center relative"
                        >
                            <div className="absolute inset-0 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-gold/5 blur-[80px] rounded-full pointer-events-none -z-10" />

                            <motion.div
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20 border border-gold/30 text-gold px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] mb-6 shadow-[0_0_20px_rgba(184,134,11,0.2)]"
                            >
                                <BookOpen className="w-3.5 h-3.5" />
                                {sectionTitle || `Section ${chapter.section_id}`}
                                {chapter.order_index > 0 ? ` · Chapter ${chapter.order_index}` : " · Special"}
                            </motion.div>

                            <h1 className={`text-4xl sm:text-5xl md:text-[3.5rem] font-heading font-black mb-6 leading-tight ${tc.heading}`}>
                                {chapter.title_english}
                            </h1>

                            {chapter.title_nepali && (
                                <h2 className={`text-xl sm:text-2xl md:text-3xl font-nepali mb-10 ${tc.subtext}`}>
                                    {chapter.title_nepali}
                                </h2>
                            )}

                            <div className="flex items-center justify-center gap-4 py-4">
                                <div className={`h-px w-16 md:w-24 bg-gradient-to-l from-gold/50 to-transparent`} />
                                <div className="flex gap-2">
                                    <span className="text-gold text-lg md:text-xl transform rotate-45 opacity-60">✦</span>
                                    <span className="text-gold text-2xl md:text-3xl animate-pulse">✦</span>
                                    <span className="text-gold text-lg md:text-xl transform rotate-45 opacity-60">✦</span>
                                </div>
                                <div className={`h-px w-16 md:w-24 bg-gradient-to-r from-gold/50 to-transparent`} />
                            </div>
                        </motion.header>

                        {/* Content Blocks */}
                        <article className="space-y-[1.5em]">
                            {/* D.I.N. component injected at the top of content */}
                            {chapter.chapter_id !== "challenge-21" && chapter.order_index > 0 && (
                                <DINTimer chapterId={chapter.chapter_id} />
                            )}
                            
                            {chapter.chapter_id === "challenge-21" ? (
                                <ChallengeTracker />
                            ) : chapter.content_blocks && chapter.content_blocks.length > 0 ? (
                                chapter.content_blocks.map((block: Block, idx: number) => {
                                    const baseClass = getBlockBaseClass(block);

                                    if (block.type === "diary") {
                                        return (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 28 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true, margin: "-60px" }}
                                                className="relative my-16 p-8 md:p-12 shadow-xl border-l-[10px] border-gold/40 rounded-r-3xl overflow-hidden"
                                                style={{
                                                    background: theme === "dark" ? "#1a2230" : theme === "sepia" ? "#f4e4c8" : "#fdfaf1",
                                                    backgroundImage: theme === "dark" ? "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)" : "linear-gradient(#e1d9c6 1px, transparent 1px)",
                                                    backgroundSize: "100% 2.5rem",
                                                    lineHeight: "2.5rem",
                                                }}
                                            >
                                                <div className={`whitespace-pre-wrap break-words text-justify italic diary-content ${block.language === 'english' ? 'font-mono' : ''} ${baseClass} ${tc.text}`}>
                                                    {parseMixedContent(block.content, baseClass)}
                                                </div>
                                                <div className="absolute top-0 right-10 w-7 h-11 bg-red-600/15 border-x border-red-900/10 shadow-sm" />
                                            </motion.div>
                                        );
                                    }

                                    if (block.type === "heading") {
                                        return (
                                            <motion.h3
                                                key={idx}
                                                className={`text-[1.3em] font-bold font-heading mt-14 mb-[0.5em] pb-3 border-b border-gold/20 whitespace-pre-wrap break-words ${tc.heading} ${baseClass}`}
                                            >
                                                {parseMixedContent(block.content, baseClass)}
                                            </motion.h3>
                                        );
                                    }

                                    if (block.type === "quote") {
                                        return (
                                            <motion.blockquote
                                                key={idx}
                                                className={`relative pl-6 pr-5 py-5 border-l-4 border-gold rounded-r-2xl italic my-8 whitespace-pre-wrap break-words ${tc.quote}`}
                                            >
                                                <div className="absolute top-3 left-3 text-gold/30 text-4xl font-serif leading-none select-none">
                                                    &ldquo;
                                                </div>
                                                <div className={`relative z-10 pl-4 ${baseClass}`}>
                                                    {parseMixedContent(block.content, baseClass)}
                                                </div>
                                            </motion.blockquote>
                                        );
                                    }

                                    if (block.type === "list") {
                                        return (
                                            <motion.li key={idx} className={`ml-6 list-disc whitespace-pre-wrap break-words ${baseClass}`}>
                                                {parseMixedContent(block.content, baseClass)}
                                            </motion.li>
                                        );
                                    }

                                    if (block.type === "image") {
                                        return (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                whileInView={{ opacity: 1, scale: 1 }}
                                                viewport={{ once: true }}
                                                className="my-12 overflow-hidden rounded-2xl border border-black/5 shadow-lg"
                                            >
                                                <img
                                                    src={block.content}
                                                    alt="Chapter Content"
                                                    className="w-full h-auto object-contain"
                                                />
                                            </motion.div>
                                        );
                                    }

                                    return (
                                        <motion.div
                                            key={idx}
                                            className={`whitespace-pre-wrap break-words text-justify ${baseClass} ${tc.text}`}
                                        >
                                            {parseMixedContent(block.content, baseClass)}
                                        </motion.div>
                                    );
                                })
                            ) : (
                                <div className={`text-center italic py-24 border-2 border-dashed rounded-2xl ${tc.subtext}`}>
                                    <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                    Chapter content coming soon.
                                </div>
                            )}

                            {chapter.chapter_id !== "challenge-21" && chapter.content_blocks && chapter.content_blocks.length > 0 && (
                                <ReflectionBox chapterId={chapter.chapter_id} sectionTitle={sectionTitle} />
                            )}
                        </article>

                        {/* End ornament */}
                        {chapter.content_blocks?.length > 0 && (
                            <div className="mt-20 flex flex-col items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <div className={`h-px w-20 ${tc.divider}`} />
                                    <span className="text-gold text-2xl">✦</span>
                                    <div className={`h-px w-20 ${tc.divider}`} />
                                </div>
                                <p className={`text-xs font-bold uppercase tracking-widest ${tc.subtext}`}>
                                    End of {chapter.order_index > 0 ? `Chapter ${chapter.order_index}` : "Section"}
                                </p>
                            </div>
                        )}
                    </main>
                </motion.div>
            </AnimatePresence>

            {/* ── Scroll to Top (Fixed outside AnimatePresence) ──────────────── */}
            <AnimatePresence>
                {showScrollTop && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        className="fixed bottom-24 right-5 lg:right-10 w-10 h-10 rounded-full bg-gold text-navy flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-[80]"
                    >
                        <ArrowUp className="w-4 h-4" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* ── Bottom Chapter Navigation (Fixed outside AnimatePresence) ── */}
            <div className={`fixed bottom-0 inset-x-0 z-[80] border-t backdrop-blur-md ${tc.nav}`}>
                <div className="max-w-4xl mx-auto px-5 lg:px-10 h-16 flex items-center justify-between">
                    <button
                        onClick={() => adjacentChapters.prev && navigateTo(adjacentChapters.prev, "prev")}
                        disabled={!adjacentChapters.prev}
                        className="flex items-center gap-2 hover:text-gold transition-colors font-semibold text-sm disabled:opacity-25"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Prev Chapter</span>
                        <span className="sm:hidden">Prev</span>
                    </button>

                    <span className={`text-[11px] font-mono font-bold uppercase tracking-widest ${tc.pageNum}`}>
                        {chapter.order_index > 0 ? `Ch. ${chapter.order_index}` : "Special"}
                    </span>

                    <button
                        onClick={() => adjacentChapters.next && navigateTo(adjacentChapters.next, "next")}
                        disabled={!adjacentChapters.next}
                        className="flex items-center gap-2 hover:text-gold transition-colors font-semibold text-sm disabled:opacity-25"
                    >
                        <span className="hidden sm:inline">Next Chapter</span>
                        <span className="sm:hidden">Next</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </>
    );
}
