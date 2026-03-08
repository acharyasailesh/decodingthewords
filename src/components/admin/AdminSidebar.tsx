"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    FileText,
    Settings,
    Users,
    LogOut,
    BookOpen,
    ChevronRight,
    InboxIcon,
    Star,
    Library,
    Database,
    Globe
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const navItems = [
    { href: "/", label: "View Website", icon: Globe },
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/chapters", label: "Book Content", icon: BookOpen },
    { href: "/admin/submissions", label: "Submissions", icon: InboxIcon },
    { href: "/admin/users", label: "Users & Licenses", icon: Users },
    { href: "/admin/testimonials", label: "Testimonials", icon: Star },
    { href: "/admin/settings", label: "Site Settings", icon: Settings },
    { href: "/admin/backup", label: "Backup & Export", icon: Database },
    { href: "/read", label: "Read Book", icon: Library },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    return (
        <aside className="w-64 min-h-screen bg-navy text-white flex flex-col shrink-0">
            {/* Logo */}
            <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center font-heading font-black text-gold text-lg">
                        W
                    </div>
                    <div>
                        <p className="font-heading font-bold text-sm leading-tight">Admin Panel</p>
                        <p className="text-white/40 text-xs font-medium">Decoding the Words</p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group ${isActive
                                ? "bg-gold text-navy shadow-md"
                                : "text-white/60 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <item.icon className="w-4 h-4 shrink-0" />
                            {item.label}
                            {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom */}
            <div className="p-4 border-t border-white/10">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-white/50 hover:bg-red-500/10 hover:text-red-400 transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
