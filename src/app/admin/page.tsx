"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users, FileCheck, Clock, DollarSign, TrendingUp, Check } from "lucide-react";
import Link from "next/link";

type Stats = {
    total_submissions: number;
    pending: number;
    approved: number;
    rejected: number;
    total_users: number;
};

type RecentSubmission = {
    id: string;
    name: string;
    email: string;
    status: string;
    reference_number: string;
    submitted_at: string;
};

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [recent, setRecent] = useState<RecentSubmission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch submission stats
                const { data: submissions } = await supabase
                    .from("submissions")
                    .select("status");

                const { data: users } = await supabase
                    .from("users")
                    .select("id");

                const { data: recentSubs } = await supabase
                    .from("submissions")
                    .select("id, name, email, status, reference_number, submitted_at")
                    .order("submitted_at", { ascending: false })
                    .limit(5);

                if (submissions) {
                    setStats({
                        total_submissions: submissions.length,
                        pending: submissions.filter((s) => s.status === "pending").length,
                        approved: submissions.filter((s) => s.status === "approved").length,
                        rejected: submissions.filter((s) => s.status === "rejected").length,
                        total_users: users?.length || 0,
                    });
                }
                if (recentSubs) setRecent(recentSubs as RecentSubmission[]);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const statCards = stats
        ? [
            { label: "Total Submissions", value: stats.total_submissions, icon: FileCheck, color: "bg-blue-50 text-blue-600" },
            { label: "Pending Review", value: stats.pending, icon: Clock, color: "bg-yellow-50 text-yellow-600" },
            { label: "Approved Licenses", value: stats.approved, icon: Check, color: "bg-green-50 text-green-600" },
            { label: "Total Revenue", value: `NPR ${stats.approved * 499}`, icon: DollarSign, color: "bg-gold/10 text-amber-700" },
        ]
        : [];

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-heading font-bold text-navy">Admin Dashboard</h1>
                <p className="text-black/50 font-medium mt-1">Welcome back. Here&apos;s the latest platform overview.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                {loading
                    ? Array(4).fill(null).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl p-6 animate-pulse h-28 border border-black/5" />
                    ))
                    : statCards.map((card) => (
                        <div key={card.label} className="bg-white rounded-2xl p-6 border border-black/5 shadow-sm">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${card.color}`}>
                                <card.icon className="w-5 h-5" />
                            </div>
                            <div className="text-2xl font-bold font-mono text-navy">{card.value}</div>
                            <div className="text-xs text-black/50 font-medium mt-1">{card.label}</div>
                        </div>
                    ))}
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-5 mb-10">
                <Link href="/admin/chapters" className="bg-navy text-white rounded-2xl p-6 hover:bg-navy/90 transition-all group">
                    <TrendingUp className="w-7 h-7 text-gold mb-3" />
                    <h3 className="font-heading font-bold text-lg mb-1">Manage Book Content</h3>
                    <p className="text-white/50 text-sm">Add or edit chapters & sections</p>
                </Link>
                <Link href="/admin" className="bg-white rounded-2xl p-6 border border-black/5 shadow-sm hover:border-gold/50 transition-all">
                    <FileCheck className="w-7 h-7 text-gold mb-3" />
                    <h3 className="font-heading font-bold text-lg mb-1 text-navy">Review Payments</h3>
                    <p className="text-black/50 text-sm">Approve / reject submissions</p>
                </Link>
                <Link href="/admin/settings" className="bg-white rounded-2xl p-6 border border-black/5 shadow-sm hover:border-gold/50 transition-all">
                    <DollarSign className="w-7 h-7 text-gold mb-3" />
                    <h3 className="font-heading font-bold text-lg mb-1 text-navy">Site Settings</h3>
                    <p className="text-black/50 text-sm">Update price, QR code, SEO</p>
                </Link>
            </div>

            {/* Recent Submissions */}
            <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
                <div className="flex justify-between items-center px-6 py-4 border-b border-black/5">
                    <h2 className="font-heading font-bold text-navy">Recent Submissions</h2>
                    <Link href="/admin" className="text-sm font-semibold text-gold hover:underline">
                        View All
                    </Link>
                </div>
                <div className="divide-y divide-black/5">
                    {recent.length === 0 && !loading && (
                        <p className="p-6 text-sm text-black/40 text-center">No submissions yet.</p>
                    )}
                    {recent.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between px-6 py-4">
                            <div>
                                <p className="font-semibold text-navy text-sm">{sub.name}</p>
                                <p className="text-xs text-black/40">{sub.email} · {sub.reference_number}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                ${sub.status === "pending" ? "bg-yellow-100 text-yellow-700" : ""}
                ${sub.status === "approved" ? "bg-green-100 text-green-700" : ""}
                ${sub.status === "rejected" ? "bg-red-100 text-red-600" : ""}
              `}>
                                {sub.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
