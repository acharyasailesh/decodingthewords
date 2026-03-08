"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Loader2, ChevronLeft, Save, Move, Table as TableIcon } from "lucide-react";
import Link from "next/link";
import RichTextEditor from "@/components/admin/RichTextEditor";

type BlockType = "paragraph" | "heading" | "quote" | "list" | "image" | "diary" | "table";
type Language = "english" | "nepali" | "bilingual";

type Block = {
    type: BlockType;
    content: string;
    language: Language;
};

// Sections will be loaded dynamically from the settings table.

const BLOCK_TYPES: BlockType[] = ["paragraph", "heading", "quote", "list", "image", "diary", "table"];
const LANGUAGES: Language[] = ["english", "nepali", "bilingual"];
const EMPTY_BLOCK: Block = { type: "paragraph", content: "", language: "nepali" };

type Props = { chapterId: string };

export default function ChapterEditor({ chapterId }: Props) {
    const router = useRouter();
    const isNew = chapterId === "new";

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dbId, setDbId] = useState<string | null>(null);

    const [form, setForm] = useState({
        chapter_id: "",
        section_id: "SECTION-1",
        title_english: "",
        title_nepali: "",
        order_index: 1,
        is_preview: false,
    });
    const [blocks, setBlocks] = useState<Block[]>([{ ...EMPTY_BLOCK }]);
    const [sections, setSections] = useState<{ value: string; label: string }[]>([]);

    const fetchChapter = useCallback(async () => {
        setLoading(true);
        setError(null);

        // Fetch dynamic sections
        const { data: settingsData } = await supabase.from("settings").select("book_sections").eq("id", 1).single();
        if (settingsData?.book_sections) {
            setSections(settingsData.book_sections.map((s: any) => ({
                value: s.id,
                label: `${s.titleEn}`
            })));
        } else {
            // Fallback to sections if none exist in DB yet
            setSections([
                { value: "SECTION-1", label: "Section 1: Social Trap" },
                { value: "SECTION-2", label: "Section 2: W-O-R-D Framework" },
                { value: "SECTION-3", label: "Section 3: Procrastination & Persistence" },
                { value: "SECTION-4", label: "Section 4: WORLD Equation" },
                { value: "SPECIAL", label: "Additional Sections" },
            ]);
        }

        if (isNew) {
            setLoading(false);
            return;
        }

        const decodedId = decodeURIComponent(chapterId);
        console.log("Fetching chapter:", decodedId);

        // Try searching by ID (UUID) first if it's in UUID format
        let queryResult;
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedId)) {
            queryResult = await supabase.from("book_content").select("*").eq("id", decodedId).single();
        } else {
            queryResult = await supabase.from("book_content").select("*").eq("chapter_id", decodedId).single();
        }

        const { data, error: fetchErr } = queryResult;

        if (fetchErr || !data) {
            console.error("Database fetch error:", fetchErr);
            setError(`Chapter not found: ${decodedId}`);
        } else {
            setDbId(data.id);
            setForm({
                chapter_id: data.chapter_id,
                section_id: data.section_id,
                title_english: data.title_english,
                title_nepali: data.title_nepali,
                order_index: data.order_index,
                is_preview: data.is_preview,
            });
            setBlocks((data.content_blocks as Block[]) || [{ ...EMPTY_BLOCK }]);
        }
        setLoading(false);
    }, [isNew, chapterId]);

    useEffect(() => {
        fetchChapter();
    }, [fetchChapter]);

    const handleSave = async () => {
        if (!form.chapter_id || !form.title_english) {
            setError("Chapter ID and English Title are required.");
            return;
        }
        setSaving(true);
        setError(null);
        const payload = { ...form, content_blocks: blocks, updated_at: new Date().toISOString() };

        console.log("Saving payload:", payload);

        let err;
        if (isNew) {
            ({ error: err } = await supabase.from("book_content").insert([payload]));
        } else {
            const updateId = dbId || decodeURIComponent(chapterId);
            const column = dbId ? "id" : "chapter_id";
            ({ error: err } = await supabase.from("book_content").update(payload).eq(column, updateId));
        }

        setSaving(false);
        if (err) {
            console.error("Save failed with error:", err);
            setError(err.message);
            alert(`Save failed: ${err.message}`);
        } else {
            console.log("Save successful!");
            router.push("/admin/chapters");
            // Soft refresh to ensure newly added data shows up
            router.refresh();
        }
    };

    const updateBlock = (idx: number, field: keyof Block, value: string) =>
        setBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, [field]: value } : b)));

    const addBlock = (afterIdx: number) => {
        setBlocks((prev) => {
            const next = [...prev];
            next.splice(afterIdx + 1, 0, { ...EMPTY_BLOCK });
            return next;
        });
    };

    const removeBlock = (idx: number) => {
        if (blocks.length === 1) return;
        setBlocks((prev) => prev.filter((_, i) => i !== idx));
    };

    const moveBlock = (idx: number, dir: "up" | "down") => {
        setBlocks((prev) => {
            const next = [...prev];
            const target = dir === "up" ? idx - 1 : idx + 1;
            if (target < 0 || target >= next.length) return next;
            [next[idx], next[target]] = [next[target], next[idx]];
            return next;
        });
    };

    if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-7 h-7 animate-spin text-gold" /></div>;

    return (
        <div className="p-8 max-w-4xl">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/chapters" className="text-black/40 hover:text-navy transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-heading font-bold text-navy flex-1">
                    {isNew ? "Add New Chapter" : "Edit Chapter"}
                </h1>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-navy text-white font-bold px-6 py-3 rounded-xl hover:bg-navy/90 transition-all disabled:opacity-60 shadow-md"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? "Saving..." : "Save Chapter"}
                </button>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-semibold">{error}</div>
            )}

            {/* Meta */}
            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 mb-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-black/40 mb-5">Chapter Metadata</h2>
                <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-navy">Chapter ID <span className="text-red-400">*</span></label>
                        <input
                            value={form.chapter_id}
                            onChange={(e) => setForm((f) => ({ ...f, chapter_id: e.target.value }))}
                            placeholder="e.g. ch-1 or challenge-21"
                            className="w-full px-4 py-3 bg-offwhite border border-black/10 rounded-xl text-sm font-mono focus:border-gold outline-none"
                        />
                        <p className="text-xs text-black/40">Used as URL: /read/[chapter_id]</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-navy">Section</label>
                        <select
                            value={form.section_id}
                            onChange={(e) => setForm((f) => ({ ...f, section_id: e.target.value }))}
                            className="w-full px-4 py-3 bg-offwhite border border-black/10 rounded-xl text-sm focus:border-gold outline-none"
                        >
                            {sections.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-navy">Title (English) <span className="text-red-400">*</span></label>
                        <input
                            value={form.title_english}
                            onChange={(e) => setForm((f) => ({ ...f, title_english: e.target.value }))}
                            placeholder="e.g. The Invisible Trap"
                            className="w-full px-4 py-3 bg-offwhite border border-black/10 rounded-xl text-sm focus:border-gold outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-navy">Title (Nepali)</label>
                        <input
                            value={form.title_nepali}
                            onChange={(e) => setForm((f) => ({ ...f, title_nepali: e.target.value }))}
                            placeholder="e.g. अदृश्य जाल"
                            className="w-full px-4 py-3 bg-offwhite border border-black/10 rounded-xl text-sm font-nepali focus:border-gold outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-navy">Chapter Order #</label>
                        <input
                            type="number" min={1}
                            value={form.order_index}
                            onChange={(e) => setForm((f) => ({ ...f, order_index: parseInt(e.target.value) || 1 }))}
                            className="w-full px-4 py-3 bg-offwhite border border-black/10 rounded-xl text-sm focus:border-gold outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                        <button
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, is_preview: !f.is_preview }))}
                            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${form.is_preview ? "bg-green-500" : "bg-black/20"}`}
                        >
                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_preview ? "translate-x-7" : "translate-x-1"}`} />
                        </button>
                        <div>
                            <label className="text-sm font-bold text-navy">Free Preview</label>
                            <p className="text-xs text-black/40">Visible without license</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Blocks */}
            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-black/40">Content Blocks</h2>
                    <button
                        onClick={() => addBlock(blocks.length - 1)}
                        className="flex items-center gap-1.5 text-xs font-bold text-gold bg-gold/10 px-3 py-1.5 rounded-lg hover:bg-gold/20"
                    >
                        <Plus className="w-3.5 h-3.5" /> Add Block
                    </button>
                </div>

                <div className="space-y-4">
                    {blocks.map((block, idx) => (
                        <div key={idx} className="border border-black/10 rounded-xl overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-2 bg-[#F4F5F9] border-b border-black/5">
                                <Move className="w-4 h-4 text-black/30 cursor-grab" />
                                <span className="text-xs font-bold text-black/30">#{idx + 1}</span>
                                <select
                                    value={block.type}
                                    onChange={(e) => updateBlock(idx, "type", e.target.value)}
                                    className="ml-2 text-xs py-1 px-2 bg-white border border-black/10 rounded-md font-semibold"
                                >
                                    {BLOCK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <select
                                    value={block.language}
                                    onChange={(e) => updateBlock(idx, "language", e.target.value)}
                                    className="text-xs py-1 px-2 bg-white border border-black/10 rounded-md font-semibold"
                                >
                                    {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                                </select>
                                <div className="ml-auto flex gap-1">
                                    <button onClick={() => moveBlock(idx, "up")} disabled={idx === 0} className="px-1.5 py-0.5 text-sm rounded hover:bg-white disabled:opacity-30 transition-colors">↑</button>
                                    <button onClick={() => moveBlock(idx, "down")} disabled={idx === blocks.length - 1} className="px-1.5 py-0.5 text-sm rounded hover:bg-white disabled:opacity-30 transition-colors">↓</button>
                                    <button onClick={() => addBlock(idx)} className="p-1 rounded hover:bg-white text-green-600 transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => removeBlock(idx)} disabled={blocks.length === 1} className="p-1 rounded hover:bg-white text-red-500 disabled:opacity-30 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                            {block.type === "image" ? (
                                <textarea
                                    value={block.content}
                                    onChange={(e) => updateBlock(idx, "content", e.target.value)}
                                    rows={2}
                                    placeholder="Enter image URL..."
                                    className="w-full px-4 py-3 text-sm focus:outline-none focus:bg-sky-50/30 transition-colors resize-y font-mono"
                                />
                            ) : (
                                <RichTextEditor
                                    content={block.content}
                                    language={block.language}
                                    blockType={block.type}
                                    onChange={(val) => updateBlock(idx, "content", val)}
                                    placeholder={`Enter ${block.type} content in ${block.language}...`}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
