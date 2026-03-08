"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Edit2, Trash2, GripVertical, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

type Chapter = {
    id: string;
    chapter_id: string;
    section_id: string;
    title_english: string;
    title_nepali: string;
    order_index: number;
    is_preview: boolean;
};

type GroupedChapters = {
    [key: string]: {
        englishTitle: string;
        chapters: Chapter[];
    };
};

export default function AdminChaptersPage() {
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [sections, setSections] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        setDebugInfo(null);

        // 0. Check current user status
        const { data: { user }, error: userAuthErr } = await supabase.auth.getUser();
        if (userAuthErr || !user) {
            setError("You are not authenticated. Please log in again.");
            setLoading(false);
            return;
        }

        // 1. Verify user role in public.users table
        const { data: userData, error: userDbErr } = await supabase
            .from("users")
            .select("id, role, email")
            .eq("id", user.id)
            .single();

        if (userDbErr || !userData) {
            console.error("User check error:", userDbErr);
            setError("Admin access check failed. Your user record was not found in the public.users table.");
            setDebugInfo(`User ID: ${user.id} - ${user.email}. Database record missing or RLS blocking it.`);
            setLoading(false);
            return;
        }

        if (userData.role !== 'admin') {
            setError(`Permission Denied: Your role is '${userData.role}', but 'admin' is required.`);
            setLoading(false);
            return;
        }

        // 2. Fetch Sections
        const { data: settingsData, error: settingsErr } = await supabase.from("settings").select("book_sections").eq("id", 1).single();
        if (settingsErr) {
            console.error("Settings fetch error:", settingsErr);
        }

        const bookSections = settingsData?.book_sections || [];
        const sectionMap: Record<string, string> = {};
        bookSections.forEach((s: any) => {
            sectionMap[s.id] = `${s.titleEn} (${s.titleNp})`;
        });
        setSections(sectionMap);

        // 3. Fetch Chapters - select everything to see what we have
        const { data, error: fetchErr } = await supabase
            .from("book_content")
            .select("*")
            .order("order_index", { ascending: true });

        if (fetchErr) {
            setError(`Failed to fetch chapters: ${fetchErr.message}`);
            console.error("Fetch Error:", fetchErr);
        } else if (data) {
            console.log("Total chapters in DB:", data.length);
            setChapters(data as Chapter[]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;
        setDeletingId(id);
        await supabase.from("book_content").delete().eq("id", id);
        setDeletingId(null);
        fetchData();
    };

    const togglePreview = async (id: string, current: boolean) => {
        await supabase.from("book_content").update({ is_preview: !current }).eq("id", id);
        setChapters((prev) => prev.map((c) => (c.id === id ? { ...c, is_preview: !current } : c)));
    };

    // Group chapters by section based on dynamic sections
    const grouped = chapters.reduce((acc: GroupedChapters, ch) => {
        const sectionId = ch.section_id || "ORPHAN";
        if (!acc[sectionId]) {
            acc[sectionId] = {
                englishTitle: sections[sectionId] || (sectionId === "ORPHAN" ? "Uncategorized" : sectionId),
                chapters: []
            };
        }
        acc[sectionId].chapters.push(ch);
        return acc;
    }, {});

    return (
        <div className="p-8">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-2xl font-heading font-bold text-navy">Book Content Manager</h1>
                    <p className="text-black/50 font-medium mt-1">Add, edit, or reorder chapters and sections.</p>
                </div>
                <Link
                    href="/admin/chapters/edit?id=new"
                    className="flex items-center gap-2 bg-navy text-white font-bold px-5 py-3 rounded-xl hover:bg-navy/90 transition-all shadow-md"
                >
                    <Plus className="w-4 h-4" /> Add Chapter
                </Link>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm font-bold text-red-700">{error}</p>
                    {debugInfo && <p className="text-xs text-red-500 mt-2 font-mono">Debug: {debugInfo}</p>}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin text-gold" /></div>
            ) : chapters.length === 0 ? (
                /* Empty State */
                <div className="bg-white rounded-2xl border border-dashed border-black/15 p-16 text-center">
                    <p className="text-xl font-heading font-bold text-navy mb-2">No chapters yet</p>
                    <p className="text-black/50 text-sm mb-6">Start adding book content to enable the reader.</p>
                    <Link href="/admin/chapters/new" className="inline-flex items-center gap-2 bg-gold text-navy font-bold px-6 py-3 rounded-xl">
                        <Plus className="w-4 h-4" /> Add First Chapter
                    </Link>
                </div>
            ) : (
                <div className="space-y-5">
                    {Object.entries(grouped).map(([sectionId, group]) => (
                        <div key={sectionId} className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
                            {/* Section Header */}
                            <div
                                onClick={() => setCollapsed((c) => ({ ...c, [sectionId]: !c[sectionId] }))}
                                className="flex items-center justify-between px-6 py-4 bg-navy cursor-pointer"
                            >
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-gold mb-0.5">{sectionId}</p>
                                    <h3 className="text-white font-heading font-bold">{group.englishTitle}</h3>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-white/40 text-sm font-medium">{group.chapters.length} chapter{group.chapters.length !== 1 ? "s" : ""}</span>
                                    {collapsed[sectionId] ? <ChevronDown className="w-5 h-5 text-white/50" /> : <ChevronUp className="w-5 h-5 text-white/50" />}
                                </div>
                            </div>

                            {!collapsed[sectionId] && (
                                <ul className="divide-y divide-black/5">
                                    {group.chapters.map((ch) => (
                                        <li key={ch.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#F4F5F9]/50 transition-colors">
                                            <GripVertical className="w-4 h-4 text-black/20 shrink-0 cursor-grab" />

                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-navy text-sm truncate">{ch.title_english}</p>
                                                <p className="text-xs font-nepali text-black/50 mt-0.5 truncate">{ch.title_nepali}</p>
                                            </div>

                                            <div className="flex items-center gap-3 shrink-0">
                                                {/* Preview Toggle */}
                                                <button
                                                    onClick={() => togglePreview(ch.id, ch.is_preview)}
                                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${ch.is_preview
                                                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                        : "bg-black/5 text-black/40 hover:bg-black/10"
                                                        }`}
                                                >
                                                    {ch.is_preview ? "Preview ✓" : "Preview Off"}
                                                </button>

                                                <Link
                                                    href={`/admin/chapters/edit?id=${ch.id}`}
                                                    className="flex items-center gap-1.5 text-xs font-bold text-navy bg-offwhite px-3 py-1.5 rounded-lg hover:bg-gold/10 hover:text-gold transition-colors border border-black/10"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" /> Edit
                                                </Link>

                                                <button
                                                    onClick={() => handleDelete(ch.id, ch.title_english)}
                                                    disabled={deletingId === ch.id}
                                                    className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors border border-red-100"
                                                >
                                                    {deletingId === ch.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                                    Delete
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
