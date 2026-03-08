"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [checking, setChecking] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.replace("/login?redirect=/admin");
                return;
            }

            // Also verify they have admin role
            const { data: user } = await supabase
                .from("users")
                .select("role")
                .eq("id", session.user.id)
                .single();

            if (!user || user.role !== "admin") {
                // Not an admin — send them to the reader dashboard
                router.replace("/read");
                return;
            }

            setAuthorized(true);
            setChecking(false);
        };

        checkAuth();
    }, [router]);

    if (checking) {
        return (
            <div className="min-h-screen bg-[#F4F5F9] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-navy/40">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-sm font-semibold uppercase tracking-widest">Verifying access…</p>
                </div>
            </div>
        );
    }

    if (!authorized) return null;

    return (
        <div className="flex min-h-screen bg-[#F4F5F9]">
            <AdminSidebar />
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
