"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [announcements, setAnnouncements] = useState<{ id: string; text: string; link: string }[]>([]);
    const [isMasterActive, setIsMasterActive] = useState(false);
    const [isAnnouncementDismissed, setIsAnnouncementDismissed] = useState(false);
    const [user, setUser] = useState<any>(null);

    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);

        // Fetch Announcements and Settings
        const fetchData = async () => {
            // 1. Get Global Settings
            const { data: settings } = await supabase
                .from("settings")
                .select("announcement_active, announcement_bar, announcement_link")
                .eq("id", 1)
                .single();

            setIsMasterActive(settings?.announcement_active ?? false);

            // 2. Get List Announcements
            const { data: list } = await supabase
                .from("announcements")
                .select("id, text, link")
                .eq("is_active", true)
                .order("display_order", { ascending: true });

            if (list && list.length > 0) {
                setAnnouncements(list);
                setIsMasterActive(true); // Force on if list contains active items
            } else if (settings?.announcement_bar && settings.announcement_active) {
                // Fallback to general announcement if list is empty but toggle is on
                setAnnouncements([{
                    id: 'fallback',
                    text: settings.announcement_bar,
                    link: settings.announcement_link || ''
                }]);
            }

            console.log("Marquee Data Loaded:", {
                active: settings?.announcement_active || false,
                listCount: list?.length || 0,
                finalCount: list?.length || (settings?.announcement_active ? 1 : 0)
            });

            const dismissed = sessionStorage.getItem("announcement-dismissed") === "true";
            setIsAnnouncementDismissed(dismissed);
        };
        fetchData();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
        });

        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user || null);
        });

        return () => {
            window.removeEventListener("scroll", handleScroll);
            subscription.unsubscribe();
        };
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsMenuOpen(false);
        router.push("/");
    };

    const isHome = pathname === "/";
    const navLinks = [
        { name: "Home", href: "/" },
        { name: "Framework", href: "/framework" },
        { name: "Chapters", href: "/chapters-index" },
        { name: "Who We Are", href: "/who-we-are" },
        { name: "Testimonials", href: "/success-stories" },
    ];

    const isDarkHeader = isHome && !isScrolled;

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isDarkHeader ? "bg-transparent py-6" : "bg-navy/95 backdrop-blur-md shadow-lg py-4"}`}>
            {/* Announcement Bar */}
            <AnimatePresence>
                {isMasterActive && announcements.length > 0 && !isAnnouncementDismissed && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-gold text-navy py-2.5 px-6 relative shadow-sm flex items-center mb-4 group overflow-hidden z-[60]"
                    >
                        <div className="container mx-auto max-w-7xl flex items-center justify-center relative">
                            <div className="flex items-center gap-3 z-10 bg-gold px-4 absolute left-0 h-full">
                                <Bell className="w-3 h-3 shrink-0" />
                                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] hidden md:inline">Notifications:</span>
                            </div>

                            <div className="flex-1 overflow-hidden mx-12">
                                <motion.div
                                    animate={{ x: ["0%", "-50%"] }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 15,
                                        ease: "linear"
                                    }}
                                    className="whitespace-nowrap inline-block"
                                >
                                    <div className="inline-flex gap-12 mr-12">
                                        {announcements.map((ann) => (
                                            ann.link ? (
                                                <Link key={ann.id} href={ann.link} className="hover:underline text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em]">
                                                    {ann.text}
                                                </Link>
                                            ) : (
                                                <span key={ann.id} className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em]">
                                                    {ann.text}
                                                </span>
                                            )
                                        ))}
                                    </div>
                                    {/* Duplicate for seamless loop */}
                                    <div className="inline-flex gap-12">
                                        {announcements.map((ann) => (
                                            ann.link ? (
                                                <Link key={`${ann.id}-dup`} href={ann.link} className="hover:underline text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em]">
                                                    {ann.text}
                                                </Link>
                                            ) : (
                                                <span key={`${ann.id}-dup`} className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em]">
                                                    {ann.text}
                                                </span>
                                            )
                                        ))}
                                    </div>
                                </motion.div>
                            </div>

                            <button
                                onClick={() => {
                                    setIsAnnouncementDismissed(true);
                                    sessionStorage.setItem("announcement-dismissed", "true");
                                }}
                                className="absolute right-0 z-10 p-1 bg-gold hover:bg-navy/10 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="container mx-auto px-6 max-w-7xl flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full border-2 border-gold flex items-center justify-center text-white font-heading font-bold">
                        W
                    </div>
                    <span className="font-heading font-bold text-xl tracking-wide text-white">
                        Decoding <span className="text-gold">The Words</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link key={link.name} href={link.href} className={`text-sm font-medium transition-colors ${pathname === link.href ? "text-gold" : "text-white/80 hover:text-gold"}`}>
                            {link.name}
                        </Link>
                    ))}
                    <div className="w-px h-6 bg-white/20" />
                    {user ? (
                        <>
                            <button onClick={handleLogout} className="text-sm font-medium text-white/80 hover:text-white transition-colors">
                                Logout
                            </button>
                            <Link href="/read" className="text-sm font-bold bg-gold hover:bg-[#F2D06B] text-navy px-5 py-2.5 rounded-full transition-all shadow-md shadow-gold/20">
                                Read Book
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="text-sm font-medium text-white hover:text-gold transition-colors">
                                Login
                            </Link>
                            <Link href="/buy" className="text-sm font-bold bg-gold hover:bg-[#F2D06B] text-navy px-5 py-2.5 rounded-full transition-all shadow-md shadow-gold/20">
                                Buy Book
                            </Link>
                        </>
                    )}
                </nav>

                {/* Mobile menu button */}
                <button className="md:hidden text-white p-2" onClick={() => setIsMenuOpen(true)}>
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Mobile Nav */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: "100%" }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 bg-navy z-50 flex flex-col pt-6 pb-8 px-6 h-screen"
                    >
                        <div className="flex justify-between items-center mb-12">
                            <span className="font-heading font-bold text-xl text-white">
                                Decoding <span className="text-gold">The Words</span>
                            </span>
                            <button className="text-white p-2" onClick={() => setIsMenuOpen(false)}>
                                <X className="w-8 h-8" />
                            </button>
                        </div>
                        <nav className="flex flex-col gap-6 text-xl">
                            {navLinks.map((link) => (
                                <Link key={link.name} href={link.href} onClick={() => setIsMenuOpen(false)} className="font-heading font-semibold text-white/80 hover:text-gold active:text-gold transition-colors">
                                    {link.name}
                                </Link>
                            ))}
                            <div className="w-full h-px bg-white/10 my-4" />
                            {user ? (
                                <>
                                    <button onClick={handleLogout} className="font-heading font-semibold text-white/80 hover:text-white transition-colors text-left">
                                        Logout
                                    </button>
                                    <Link href="/read" onClick={() => setIsMenuOpen(false)} className="w-full text-center bg-gold text-navy font-bold py-4 rounded-xl mt-4 shadow-lg shadow-gold/20">
                                        Read Book
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link href="/login" onClick={() => setIsMenuOpen(false)} className="font-heading font-semibold text-white">
                                        Login
                                    </Link>
                                    <Link href="/buy" onClick={() => setIsMenuOpen(false)} className="w-full text-center bg-gold text-navy font-bold py-4 rounded-xl mt-4 shadow-lg shadow-gold/20">
                                        Buy The Book Today
                                    </Link>
                                </>
                            )}
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
