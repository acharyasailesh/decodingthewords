"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
    Loader2,
    BookOpen,
    AlertTriangle,
    LogOut,
    ChevronRight,
    Sparkles,
    CheckCircle2,
    TrendingUp,
    Settings2,
    X,
    Sun,
    Moon,
    Coffee,
    Type,
    ShieldCheck,
    Eye,
    User as UserIcon,
    Pencil,
    Check,
    ArrowUp
} from "lucide-react";
import Link from "next/link";
import { User } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";

export default function ReaderDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
    const [hasLicense, setHasLicense] = useState(false);
    const [sections, setSections] = useState<any[]>([]);
    const [chapters, setChapters] = useState<any[]>([]);
    const [isScrolled, setIsScrolled] = useState(false);
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const settingsRef = useRef<HTMLDivElement>(null);
    const settingsBtnRef = useRef<HTMLButtonElement>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [globalProgress, setGlobalProgress] = useState(0);

    // Reading Prefs
    const [showSettings, setShowSettings] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [theme, setTheme] = useState<"light" | "sepia" | "dark">("dark");
    const [fontSize, setFontSize] = useState<"small" | "medium" | "large">("medium");

    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [editNameValue, setEditNameValue] = useState("");
    const [editPhoneValue, setEditPhoneValue] = useState("");
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    const handleUpdateProfile = async (field: 'full_name' | 'phone', value: string) => {
        if (!user) return;
        setIsSavingProfile(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({ [field]: value })
                .eq('id', user.id);
            
            if (!error) {
                setProfile((prev: any) => ({ ...prev, [field]: value }));
            }
        } catch (err) {
            console.error("Error updating profile:", err);
        } finally {
            setIsSavingProfile(false);
            if (field === 'full_name') setIsEditingName(false);
            if (field === 'phone') setIsEditingPhone(false);
        }
    };

    const checkUserStatus = useCallback(async () => {
        try {
            const {
                data: { session },
                error: sessionError,
            } = await supabase.auth.getSession();

            // Fetch public sections (settings) - anyone can see this
            const { data: settingsData } = await supabase
                .from("settings")
                .select("book_sections")
                .eq("id", 1)
                .single();
            const bookSections = settingsData?.book_sections || [];

            // Fetch all chapters (is_preview ones are public, others might be hidden or just show metadata depending on RLS)
            const { data: chapterData } = await supabase
                .from("book_content")
                .select("id, chapter_id, title_english, title_nepali, section_id, order_index, is_preview")
                .order("order_index", { ascending: true });

            if (chapterData) {
                setChapters(chapterData);
                const dynamicSections = bookSections.map((sec: any) => ({
                    ...sec,
                    chapters: chapterData.filter((ch: any) => ch.section_id === sec.id)
                }));
                setSections(dynamicSections);
            }

            if (sessionError || !session) {
                // Not logged in: allow them to see the index but with guest status
                setUser(null);
                setProfile(null);
                setHasLicense(false);
                setGlobalProgress(0);
                setLoading(false);
                return;
            }

            // Logged in: fetch extended info
            setUser(session.user);

            const { data: profileData } = await supabase
                .from("users")
                .select("*")
                .eq("id", session.user.id)
                .single();

            if (profileData) {
                setProfile(profileData);
                setHasLicense(profileData.has_license);
            }

            // Fetch progress independently of profile entry
            const { data: reflectData } = await supabase
                .from("user_reflections")
                .select("chapter_id")
                .eq("user_id", session.user.id);

            if (reflectData) {
                const uniqueChapters = new Set(reflectData.map(r => r.chapter_id));
                const totalCount = chapterData ? chapterData.length : 20;
                const progressPercentage = Math.round((uniqueChapters.size / totalCount) * 100);
                setGlobalProgress(progressPercentage);
            }

            // Fetch purchase / submissions
            const { data: subData } = await supabase
                .from("submissions")
                .select("*")
                .eq("email", session.user.email)
                .order("created_at", { ascending: false });

            if (subData) setPurchaseHistory(subData);

        } catch (err) {
            console.error("Dashboard check error:", err);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        checkUserStatus();
        const saved = localStorage.getItem("reader-prefs");
        if (saved) {
            try {
                const prefs = JSON.parse(saved);
                if (prefs.theme) setTheme(prefs.theme);
                if (prefs.fontSize) setFontSize(prefs.fontSize);
            } catch { /* ignore */ }
        }
    }, [checkUserStatus]);

    const savePrefs = (updates: object) => {
        const saved = localStorage.getItem("reader-prefs");
        const prefs = saved ? JSON.parse(saved) : {};
        localStorage.setItem("reader-prefs", JSON.stringify({ ...prefs, ...updates }));
    };

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
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        if (showSettings) document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("scroll", handleScroll);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", handleScroll);
        };
    }, [showSettings]);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const THEMES = [
        { id: "light" as const, label: "Light", icon: Sun, bg: "bg-white", fg: "text-navy" },
        { id: "sepia" as const, label: "Sepia", icon: Coffee, bg: "bg-[#FBF0D9]", fg: "text-[#5F4B32]" },
        { id: "dark" as const, label: "Dark", icon: Moon, bg: "bg-[#141920]", fg: "text-gray-200" },
    ];

    const T = {
        light: {
            bg: "bg-offwhite",
            card: "bg-white/[0.6] border-black/[0.05]",
            text: "text-navy",
            subtext: "text-navy/40",
            heading: "text-navy",
            accent: "text-gold",
            sidebar: "bg-white/[0.6] border-black/[0.05]",
            glow: "rgba(184,134,11,0.08)",
        },
        sepia: {
            bg: "bg-[#F4E2C7]",
            card: "bg-[#FBF0D9]/[0.6] border-[#DECBAF]",
            text: "text-[#5F4B32]",
            subtext: "text-[#5F4B32]/40",
            heading: "text-[#3D2B1F]",
            accent: "text-[#B8860B]",
            sidebar: "bg-[#FBF0D9]/[0.6] border-[#DECBAF]",
            glow: "rgba(184,134,11,0.1)",
        },
        dark: {
            bg: "bg-[#070B14]",
            card: "bg-[#0d1326]/40 border-white/[0.08]",
            text: "text-white/80",
            subtext: "text-white/30",
            heading: "text-white",
            accent: "text-gold",
            sidebar: "bg-white/[0.03] border-white/[0.1]",
            glow: "rgba(184,134,11,0.05)",
        },
    };
    const tc = T[theme];

    if (loading) {
        return (
            <div className="min-h-screen bg-navy flex flex-col items-center justify-center gap-6">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
                    <Loader2 className="w-12 h-12 text-gold" />
                </motion.div>
                <p className="font-heading text-white/50 text-lg tracking-widest uppercase">Opening your library…</p>
            </div>
        );
    }

    // If user is LOGGED IN but doesn't have a license, block them (unless they are an admin)
    const isAdmin = profile?.role === 'admin';
    if (user && !hasLicense && !isAdmin) {
        return (
            <div className="min-h-screen bg-[#070B14] flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gold/5 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2" />
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full bg-white/[0.03] backdrop-blur-2xl rounded-[2.5rem] p-12 text-center border border-white/10 shadow-2xl relative z-10">
                    <div className="w-24 h-24 rounded-3xl bg-gold/10 flex items-center justify-center mx-auto mb-8 border border-gold/20">
                        <AlertTriangle className="w-12 h-12 text-gold animate-pulse" />
                    </div>
                    <h2 className="text-3xl font-heading font-black text-white mb-4">Unlock Your Journey</h2>
                    <p className="text-white/50 font-medium mb-10 leading-relaxed">Your account is ready, but you haven&apos;t activated your digital license.</p>
                    <div className="flex flex-col gap-4">
                        <Link href="/buy" className="bg-gradient-to-r from-gold via-gold-light to-gold text-navy font-black py-4 px-8 rounded-2xl transition-all hover:scale-[1.02] shadow-[0_10px_30px_rgba(184,134,11,0.3)]">Get Instant Access</Link>
                        <button onClick={() => supabase.auth.signOut()} className="text-white/30 hover:text-white font-bold text-sm transition-colors py-3">Sign Out</button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div ref={containerRef} onMouseMove={(e) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }} className={`min-h-screen relative transition-colors duration-500 ${tc.bg}`}>
            <div className="pointer-events-none fixed inset-0 z-0 opacity-50 transition-opacity duration-300" style={{ background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, ${tc.glow}, transparent 40%)` }} />

            <div className="fixed top-0 left-0 right-0 z-[100] w-full pointer-events-none">
                <div className="max-w-[1440px] mx-auto px-6 pt-4 lg:pt-6">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={`pointer-events-auto flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 px-6 lg:px-10 py-4 lg:py-6 rounded-b-[2.5rem] lg:rounded-[2.5rem] border bg-white/10 backdrop-blur-md border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] group cursor-default transition-all duration-500`}>
                    <div className="flex items-center gap-6">
                        <Link
                            href="/"
                            title="Go to Website Homepage"
                            className="relative w-16 h-16 rounded-2xl bg-navy border border-gold/40 flex items-center justify-center shadow-2xl overflow-hidden group hover:scale-105 transition-transform cursor-pointer"
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-gold/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                            <BookOpen className="w-7 h-7 text-gold group-hover:scale-110 transition-transform relative z-10" />
                        </Link>
                        <div>
                            <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${tc.accent} mb-1.5 flex items-center gap-2`}>
                                <Sparkles className="w-3.5 h-3.5 fill-current" />
                                {user ? "Authorized Decoder" : "Exploring Library"}
                            </p>
                            <p className={`${tc.heading} font-heading font-bold text-lg md:text-xl truncate max-w-[240px]`}>
                                {profile?.full_name || profile?.display_name || (user ? user.email?.split('@')[0] : "Guest Reader")}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                <button onClick={() => setShowProfile(!showProfile)} className={`flex items-center gap-2 py-3 px-6 rounded-2xl transition-all ${showProfile ? "bg-gold text-navy shadow-lg" : `bg-white/[0.05] ${tc.text} hover:bg-white/[0.2]`}`}>
                                    <span className="text-sm font-black uppercase tracking-widest hidden md:inline">Account</span>
                                    <Settings2 className="w-5 h-5" />
                                </button>
                                <button onClick={async () => { await supabase.auth.signOut(); router.push("/"); }} className={`flex items-center gap-2 bg-white/[0.05] hover:bg-red-500/10 border border-white/[0.1] ${tc.text} hover:text-red-400 px-6 py-3 rounded-2xl text-sm font-black transition-all group`}><LogOut className="w-4 h-4" /> Sign Out</button>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className={`flex items-center gap-2 bg-gold text-navy px-8 py-3 rounded-2xl text-sm font-black transition-all hover:scale-105 shadow-lg`}>
                                    Login to Unlock Full Book
                                </Link>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
            </div>

            <div className="relative z-[50] max-w-[1440px] mx-auto px-6 py-4 lg:py-6 pt-32 lg:pt-40">
                <AnimatePresence>
                    {showProfile && (
                        <>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowProfile(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]" />
                            <motion.div initial={{ opacity: 0, x: 400 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 400 }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className={`fixed top-0 right-0 h-full w-full sm:w-[500px] shadow-[0_0_100px_rgba(0,0,0,0.5)] z-[100] p-8 lg:p-12 overflow-y-auto border-l border-white/10 ${theme === 'dark' ? 'bg-[#0a0f18] text-gray-200' : 'bg-white text-navy'}`}>
                                <div className="flex items-center justify-between mb-16">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center border border-gold/20">
                                            <UserIcon className="w-6 h-6 text-gold" />
                                        </div>
                                        <h2 className="text-3xl font-heading font-black">Account Details</h2>
                                    </div>
                                    <button onClick={() => setShowProfile(false)} className="p-3 hover:bg-black/5 rounded-2xl transition-colors"><X className="w-7 h-7" /></button>
                                </div>

                                <div className="space-y-10">
                                    {/* Personal Info */}
                                    <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-gold/10 transition-colors" />
                                        <p className="text-[10px] font-black text-gold uppercase tracking-[0.3em] mb-6">Personal Identity</p>
                                        <div className="space-y-6">
                                            <div>
                                                <div className="flex items-center justify-between group/edit">
                                                    <p className="text-[10px] opacity-40 uppercase font-black tracking-widest mb-1">Full Name</p>
                                                    {!isEditingName && (
                                                        <button onClick={() => { setIsEditingName(true); setEditNameValue(profile?.full_name || ''); }} className="opacity-0 group-hover/edit:opacity-100 transition-opacity text-gold hover:text-gold/80">
                                                            <Pencil className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                                {isEditingName ? (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <input 
                                                            type="text" 
                                                            value={editNameValue} 
                                                            onChange={(e) => setEditNameValue(e.target.value)}
                                                            className={`flex-1 bg-black/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm font-bold outline-none focus:border-gold transition-colors ${theme === 'dark' ? 'text-white' : 'text-navy'}`}
                                                            placeholder="Enter your full name"
                                                            disabled={isSavingProfile}
                                                        />
                                                        <button onClick={() => handleUpdateProfile('full_name', editNameValue)} disabled={isSavingProfile} className="p-1.5 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30 transition-colors">
                                                            {isSavingProfile && isEditingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                        </button>
                                                        <button onClick={() => setIsEditingName(false)} disabled={isSavingProfile} className="p-1.5 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <p className="text-xl font-bold">{profile?.full_name || 'N/A'}</p>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-[10px] opacity-40 uppercase font-black tracking-widest mb-1">Email Address</p>
                                                <p className="text-xl font-bold opacity-80">{user?.email}</p>
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between group/edit">
                                                    <p className="text-[10px] opacity-40 uppercase font-black tracking-widest mb-1">Phone Number</p>
                                                    {!isEditingPhone && (
                                                        <button onClick={() => { setIsEditingPhone(true); setEditPhoneValue(profile?.phone || purchaseHistory[0]?.phone || ''); }} className="opacity-0 group-hover/edit:opacity-100 transition-opacity text-gold hover:text-gold/80">
                                                            <Pencil className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                                {isEditingPhone ? (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <input 
                                                            type="text" 
                                                            value={editPhoneValue} 
                                                            onChange={(e) => setEditPhoneValue(e.target.value)}
                                                            className={`flex-1 bg-black/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm font-bold outline-none focus:border-gold transition-colors ${theme === 'dark' ? 'text-white' : 'text-navy'}`}
                                                            placeholder="Enter phone number"
                                                            disabled={isSavingProfile}
                                                        />
                                                        <button onClick={() => handleUpdateProfile('phone', editPhoneValue)} disabled={isSavingProfile} className="p-1.5 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30 transition-colors">
                                                            {isSavingProfile && isEditingPhone ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                        </button>
                                                        <button onClick={() => setIsEditingPhone(false)} disabled={isSavingProfile} className="p-1.5 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    profile?.phone || purchaseHistory[0]?.phone ? (
                                                        <p className="text-xl font-bold opacity-80">{profile?.phone || purchaseHistory[0]?.phone}</p>
                                                    ) : (
                                                        <p className="opacity-30 italic text-sm">No phone number linked (hover to add)</p>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* License Details */}
                                    <div className="bg-gradient-to-br from-navy to-[#1a202c] border border-gold/30 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl">
                                        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gold/10 rotate-12 blur-2xl" />
                                        <p className="text-[10px] font-black text-gold uppercase tracking-[0.3em] mb-6">Active License</p>
                                        <div className="flex items-center gap-6 mb-8">
                                            <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center border border-gold/40">
                                                <ShieldCheck className="w-8 h-8 text-gold" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-black text-white">Authorized</p>
                                                <p className="text-[10px] opacity-50 font-black uppercase tracking-widest">Premium Content Enabled</p>
                                            </div>
                                        </div>
                                        <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                                            <p className="text-[9px] opacity-30 uppercase font-bold tracking-[0.2em] mb-1">Reference ID</p>
                                            <p className="text-xs font-mono opacity-60 tracking-widest">{purchaseHistory[0]?.reference || 'SVR-DEC-001'}</p>
                                        </div>
                                    </div>

                                    {/* Order History */}
                                    {purchaseHistory.length > 0 && (
                                        <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8">
                                            <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.3em] mb-6">Purchase History</p>
                                            <div className="space-y-4">
                                                {purchaseHistory.map((sub: any) => (
                                                    <div key={sub.id} className="flex flex-col gap-4 p-5 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="text-sm font-bold">NPR {sub.amount}</p>
                                                                <p className="text-[10px] opacity-40">{new Date(sub.created_at).toLocaleDateString()}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[9px] font-black uppercase tracking-widest border border-green-500/20">Success</span>
                                                                <p className="text-[9px] opacity-20 font-mono mt-1">{sub.reference_number}</p>
                                                            </div>
                                                        </div>
                                                        {sub.screenshot_path && (
                                                            <a
                                                                href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/screenshots/${sub.screenshot_path}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all group"
                                                            >
                                                                <Eye className="w-3.5 h-3.5 text-gold group-hover:scale-110 transition-transform" />
                                                                View Payment Proof
                                                            </a>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Preferences Shortcut */}
                                    <div className="pt-8 border-t border-white/5">
                                        <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.3em] mb-6 px-2">Display Preferences</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-4">
                                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2"><Sun size={12} /> Theme Selection</p>
                                                <div className="flex gap-2">
                                                    {['light', 'dark'].map(t => (
                                                        <button key={t} onClick={() => { setTheme(t as any); savePrefs({ theme: t }); }} className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${theme === t ? "border-gold bg-gold/10 text-gold shadow-[0_0_15px_rgba(184,134,11,0.2)]" : "border-white/10 opacity-30 hover:opacity-100"}`}>
                                                            {t === 'light' ? <Sun size={16} /> : <Moon size={16} />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-10">
                                        <button onClick={() => supabase.auth.signOut()} className="w-full py-4 rounded-2xl border border-red-500/20 text-red-400 hover:bg-red-500/10 font-black text-xs uppercase tracking-[0.3em] transition-all">Sign Out Session</button>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                <div className="flex flex-col lg:flex-row gap-12 xl:gap-20">
                    <div className="lg:w-[400px] xl:w-[440px] shrink-0">
                        <div className="sticky top-32 space-y-12">
                            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
                                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-gold/20 via-gold/5 to-transparent border-l-4 border-gold text-gold px-6 py-3 text-[11px] font-black uppercase tracking-[0.4em] mb-10">Your Book Library</div>
                                <h1 className={`text-6xl md:text-7xl lg:text-[5rem] font-heading font-black leading-[0.95] mb-8 tracking-tighter ${tc.heading}`}>Decoding<br /><span className={`text-transparent bg-clip-text bg-gradient-to-r ${theme === 'dark' ? 'from-white via-white to-white/40' : 'from-navy via-navy to-navy/50'}`}>The Words</span></h1>
                                <p className={`text-3xl font-nepali mb-12 border-l-4 ${tc.accent}/40 pl-6 py-2 ${tc.accent}`}>शब्दले संसार बदल्छ</p>

                                <div className={`${tc.sidebar} backdrop-blur-2xl rounded-[3rem] p-10 border shadow-2xl relative overflow-hidden`}>
                                    <div className="flex items-end justify-between mb-8 relative z-10">
                                        <div><h3 className={`text-xs font-black uppercase tracking-[0.2em] ${tc.subtext} mb-2`}>Reading Journey</h3><div className={`text-5xl font-heading font-black ${tc.heading}`}>{globalProgress}<span className={`${tc.accent} text-2xl ml-1`}>%</span></div></div>
                                        <div className={`w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center`}><TrendingUp className={`w-8 h-8 ${tc.accent}/40`} /></div>
                                    </div>
                                    <div className="relative h-4 bg-black/20 rounded-full overflow-hidden mb-10 p-1">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${globalProgress}%` }} transition={{ duration: 2 }} className="absolute h-full bg-gradient-to-r from-gold to-yellow-400 rounded-full" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.05]"><div className={`text-[10px] font-bold ${tc.subtext} uppercase tracking-widest mb-1`}>{chapters.length} TOTAL</div><div className={`text-sm font-bold ${tc.accent}`}>Chapters</div></div>
                                        <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.05]"><div className={`text-[10px] font-bold ${tc.subtext} uppercase tracking-widest mb-1`}>REALTIME</div><div className="text-sm font-bold opacity-60">Syncing</div></div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        {sections.length > 0 ? (
                            <div className="space-y-32 lg:pl-10 relative">
                                <div className="absolute top-0 bottom-0 left-[2px] w-[2px] bg-gradient-to-b from-gold/40 via-gold/5 to-transparent hidden lg:block opacity-20" />

                                {sections.filter(s => s.chapters.length > 0).map((section, sIdx) => {
                                    // Visual themes for sections
                                    const themes = [
                                        { color: "from-gold to-yellow-600", accent: "text-gold" },
                                        { color: "from-blue-500 to-indigo-600", accent: "text-blue-400" },
                                        { color: "from-purple-500 to-pink-600", accent: "text-purple-400" },
                                        { color: "from-emerald-500 to-teal-600", accent: "text-emerald-400" },
                                        { color: "from-rose-500 to-orange-600", accent: "text-rose-400" }
                                    ];
                                    const st = themes[sIdx % themes.length];

                                    return (
                                        <motion.div
                                            key={section.id}
                                            initial={{ opacity: 0, y: 40 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true, margin: "-100px" }}
                                            transition={{ duration: 0.8 }}
                                            className="relative"
                                        >
                                            <div className="flex items-center gap-10 mb-16 relative z-10">
                                                <div className={`w-20 h-20 rounded-[2rem] bg-gradient-to-br ${st.color} flex items-center justify-center shadow-2xl border border-white/20 transform -rotate-3 hover:rotate-0 transition-transform duration-500`}>
                                                    <Sparkles className="w-10 h-10 text-navy drop-shadow-lg" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-4 mb-2">
                                                        <div className="h-[2px] w-12 bg-gold/30" />
                                                        <h2 className={`text-4xl md:text-5xl font-heading font-black tracking-tighter ${tc.heading}`}>{section.titleEn}</h2>
                                                    </div>
                                                    <div className="flex items-center gap-4 pl-16">
                                                        <p className={`text-sm font-nepali opacity-60`}>{section.titleNp}</p>
                                                        <span className="w-1 h-1 rounded-full bg-white/20" />
                                                        <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${st.accent}`}>Level {sIdx + 1}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pl-0 lg:pl-12">
                                                {section.chapters.map((chap: any, i: number) => {
                                                    const chapIdx = chapters.findIndex(c => c.chapter_id === chap.chapter_id);
                                                    const sectionLetters = ["W", "O", "R", "D"];
                                                    const frameworkLetter = sectionLetters[sIdx] || "G";

                                                    // Unlock logic:
                                                    // 1. FREE PREVIEW is always unlocked
                                                    // 2. Otherwise requires license
                                                    const isLocked = !chap.is_preview && !hasLicense && !isAdmin;

                                                    return (
                                                        <motion.div
                                                            key={chap.chapter_id}
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            whileInView={{ opacity: 1, scale: 1 }}
                                                            viewport={{ once: true }}
                                                            transition={{ duration: 0.6, delay: i * 0.1 }}
                                                            onMouseEnter={() => setHoveredIdx(chapIdx)}
                                                            onMouseLeave={() => setHoveredIdx(null)}
                                                        >
                                                            <Link href={isLocked ? "#" : `/read/${chap.chapter_id}`} className={`block group relative ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}>
                                                                <AnimatePresence>
                                                                    {hoveredIdx === chapIdx && !isLocked && (
                                                                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className={`absolute -inset-6 rounded-[3.5rem] bg-gradient-to-br ${st.color} opacity-[0.08] blur-2xl z-0`} />
                                                                    )}
                                                                </AnimatePresence>

                                                                <div className={`relative z-10 ${tc.card} backdrop-blur-3xl border rounded-[3rem] p-10 transition-all duration-700 flex flex-col gap-8 ${hoveredIdx === chapIdx && !isLocked ? `border-gold/50 shadow-[0_30px_80px_rgba(0,0,0,0.5)] -translate-y-4` : "shadow-2xl border-white/5"}`}>
                                                                    {/* Framework background letter */}
                                                                    {frameworkLetter && (
                                                                        <div className="absolute top-10 right-10 text-[120px] font-heading font-black opacity-[0.03] select-none pointer-events-none group-hover:opacity-[0.08] transition-opacity leading-none">
                                                                            {frameworkLetter}
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <div className="flex items-center justify-between mb-6">
                                                                            <div className="flex items-center gap-3">
                                                                                <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${st.accent}`}>Selection {chap.order_index}</span>
                                                                                {frameworkLetter && (
                                                                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gold/10 text-gold text-[10px] font-black border border-gold/20">{frameworkLetter}</span>
                                                                                )}
                                                                            </div>
                                                                            {chap.is_preview ? (
                                                                                <span className="bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Free Preview</span>
                                                                            ) : !isLocked && (
                                                                                <div className="w-2 h-2 rounded-full bg-gold shadow-[0_0_10px_rgba(184,134,11,0.8)] animate-pulse" />
                                                                            )}
                                                                        </div>
                                                                        <h3 className={`text-2xl font-heading font-black leading-[1.1] mb-3 group-hover:text-gold transition-colors ${tc.heading}`}>{chap.title_english}</h3>
                                                                        <p className={`text-lg font-nepali opacity-40 group-hover:opacity-100 transition-opacity leading-relaxed`}>{chap.title_nepali}</p>
                                                                    </div>

                                                                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center">
                                                                                <BookOpen className="w-3.5 h-3.5 opacity-20" />
                                                                            </div>
                                                                            <span className="text-[9px] font-black uppercase tracking-widest opacity-30">Decoded Content</span>
                                                                        </div>
                                                                        <div className={`w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-gold/40 transition-all duration-500 overflow-hidden relative`}>
                                                                            <div className={`absolute inset-0 bg-gradient-to-br ${st.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                                                                            <ChevronRight className={`w-6 h-6 transform transition-transform duration-500 group-hover:translate-x-1 ${hoveredIdx === chapIdx ? st.accent : 'opacity-20'}`} />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-40 bg-white/[0.02] border border-white/5 rounded-[4rem] backdrop-blur-3xl">
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}><Sparkles className="w-20 h-20 mx-auto mb-8 opacity-20 text-gold" /></motion.div>
                                <p className="text-2xl font-heading font-black mb-4 text-white">Initializing Library Content</p>
                                <p className="text-white/40 font-medium">Constructing your digital experience...</p>
                            </motion.div>
                        )}
                    </div>
                </div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className={`mt-24 text-center ${tc.subtext} text-[10px] font-mono uppercase tracking-[0.2em] relative z-10 pb-10 border-t border-white/[0.05] pt-10`}>
                    © Decoding The Words · {user ? "Authenticated Session" : "Guest Access"} · Master Copy (v2)
                </motion.div>
            </div>

            <AnimatePresence>
                {isScrolled && (
                    <motion.button
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.8 }}
                        onClick={scrollToTop}
                        className="fixed bottom-8 right-8 z-[80] w-14 h-14 rounded-full bg-gold hover:bg-gold-light text-navy shadow-[0_10px_30px_rgba(184,134,11,0.3)] flex items-center justify-center transition-all hover:-translate-y-1 hover:scale-105"
                        title="Scroll to Top"
                    >
                        <ArrowUp className="w-6 h-6" />
                    </motion.button>
                )}
            </AnimatePresence>

            <style jsx global>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
}
