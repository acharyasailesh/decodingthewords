"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Loader2, ChevronLeft, Save, Move, Upload, Table as TableIcon } from "lucide-react";
import Link from "next/link";
import RichTextEditor from "@/components/admin/RichTextEditor";

type BlockType = "paragraph" | "heading" | "quote" | "list" | "image" | "diary" | "table";
type Language = "english" | "nepali";

type Block = {
    type: BlockType;
    content: string;
    language: Language;
};

const BLOCK_TYPES: BlockType[] = ["paragraph", "heading", "quote", "list", "image", "diary", "table"];
const LANGUAGES: Language[] = ["english", "nepali"];
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

        const { data: settingsData } = await supabase.from("settings").select("book_sections").eq("id", 1).single();
        if (settingsData?.book_sections) {
            setSections(settingsData.book_sections.map((s: any) => ({
                value: s.id,
                label: `${s.titleEn}`
            })));
        }

        if (isNew) {
            setLoading(false);
            return;
        }

        const decodedId = decodeURIComponent(chapterId);
        let queryResult;
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedId)) {
            queryResult = await supabase.from("book_content").select("*").eq("id", decodedId).single();
        } else {
            queryResult = await supabase.from("book_content").select("*").eq("chapter_id", decodedId).single();
        }

        const { data, error: fetchErr } = queryResult;

        if (fetchErr || !data) {
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
            setError(err.message);
            alert(`Save failed: ${err.message}`);
        } else {
            router.push("/admin/chapters");
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

    const handleImageUpload = async (idx: number, file: File) => {
        setSaving(true);
        try {
            const ext = file.name.split(".").pop();
            const path = `chapters/lesson-${Date.now()}.${ext}`;
            const { error: uploadErr } = await supabase.storage
                .from("assets")
                .upload(path, file);

            if (uploadErr) throw uploadErr;

            const { data: { publicUrl } } = supabase.storage.from("assets").getPublicUrl(path);
            updateBlock(idx, "content", publicUrl);
        } catch (err: any) {
            alert(`Upload failed: ${err.message}`);
        } finally {
            setSaving(false);
        }
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

            {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-semibold">{error}</div>}

            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 mb-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-black/40 mb-5">Chapter Metadata</h2>
                <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-navy">Chapter ID <span className="text-red-400">*</span></label>
                        <input
                            value={form.chapter_id}
                            onChange={(e) => setForm((f) => ({ ...f, chapter_id: e.target.value }))}
                            placeholder="e.g. ch-1"
                            className="w-full px-4 py-3 bg-offwhite border border-black/10 rounded-xl text-sm font-mono focus:border-gold outline-none"
                        />
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
                            className="w-full px-4 py-3 bg-offwhite border border-black/10 rounded-xl text-sm focus:border-gold outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-navy">Title (Nepali)</label>
                        <input
                            value={form.title_nepali}
                            onChange={(e) => setForm((f) => ({ ...f, title_nepali: e.target.value }))}
                            className="w-full px-4 py-3 bg-offwhite border border-black/10 rounded-xl text-sm font-nepali focus:border-gold outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-navy">Chapter Order #</label>
                        <input
                            type="number" value={form.order_index}
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
                        <label className="text-sm font-bold text-navy">Free Preview</label>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-black/40">Content Blocks</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                if (confirm("Are you sure you want to delete ALL blocks?")) {
                                    setBlocks([{ ...EMPTY_BLOCK }]);
                                }
                            }}
                            className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Clear All
                        </button>
                        <button onClick={() => addBlock(blocks.length - 1)} className="flex items-center gap-1.5 text-xs font-bold text-gold bg-gold/10 px-3 py-1.5 rounded-lg hover:bg-gold/20 transition-colors">
                            <Plus className="w-3.5 h-3.5" /> Add Block
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {blocks.map((block, idx) => (
                        <div key={idx} className="border border-black/10 rounded-xl overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-2 bg-[#F4F5F9] border-b border-black/5">
                                <Move className="w-4 h-4 text-black/30" />
                                <span className="text-xs font-bold text-black/30">#{idx + 1}</span>
                                <select
                                    value={block.type}
                                    onChange={(e) => updateBlock(idx, "type", e.target.value as BlockType)}
                                    className="ml-2 text-xs py-1 px-2 bg-white border border-black/10 rounded-md font-semibold"
                                >
                                    {BLOCK_TYPES.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                                </select>
                                <select
                                    value={block.language}
                                    onChange={(e) => updateBlock(idx, "language", e.target.value as Language)}
                                    className="text-xs py-1 px-2 bg-white border border-black/10 rounded-md font-semibold"
                                >
                                    {LANGUAGES.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
                                </select>
                                <div className="ml-auto flex gap-1">
                                    <button onClick={() => moveBlock(idx, "up")} disabled={idx === 0} className="px-1.5 py-0.5 text-sm disabled:opacity-30">↑</button>
                                    <button onClick={() => moveBlock(idx, "down")} disabled={idx === blocks.length - 1} className="px-1.5 py-0.5 text-sm disabled:opacity-30">↓</button>
                                    <button onClick={() => removeBlock(idx)} className="p-1 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>

                            {block.type === "image" ? (
                                <div className="p-8 bg-offwhite/50 flex flex-col items-center gap-4">
                                    {block.content ? (
                                        <div className="relative group max-w-sm rounded-xl overflow-hidden shadow-lg border border-black/10">
                                            <img src={block.content} alt="Preview" className="w-full h-auto" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                <label className="bg-white text-navy px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:scale-110 transition-transform">
                                                    Change Image
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(idx, e.target.files[0])} />
                                                </label>
                                                <button onClick={() => updateBlock(idx, "content", "")} className="bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:scale-110 transition-transform">
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center w-full max-w-md h-40 border-2 border-dashed border-black/10 rounded-2xl cursor-pointer hover:border-gold hover:bg-gold/5 transition-all">
                                            <Upload className="w-8 h-8 text-gold mb-2" />
                                            <span className="text-sm font-bold text-navy">Click to upload lesson image</span>
                                            <span className="text-xs text-black/30 mt-1">(Support PNG, JPG, WEBP)</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(idx, e.target.files[0])} />
                                        </label>
                                    )}
                                    <div className="w-full max-w-md">
                                        <label className="text-[10px] font-bold text-black/30 uppercase block mb-1">Or paste Image URL</label>
                                        <input
                                            value={block.content}
                                            onChange={(e) => updateBlock(idx, "content", e.target.value)}
                                            className="w-full px-4 py-2 bg-white border border-black/10 rounded-xl text-xs outline-none focus:border-gold"
                                            placeholder="https://example.com/image.png"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <RichTextEditor
                                    content={block.content}
                                    language={block.language}
                                    blockType={block.type}
                                    onChange={(val) => updateBlock(idx, "content", val)}
                                    placeholder={`Enter ${block.type} in ${block.language}...`}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
