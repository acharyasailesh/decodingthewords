"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Save, Loader2, Upload, Plus, Trash2, GripVertical } from "lucide-react";

type BookSection = { id: string; titleEn: string; titleNp: string };
type AuthorRole = { text: string; link: string };
type AuthorDetails = { name: string; experience: string; roles: (string | AuthorRole)[]; description: string };
type Announcement = { id: string; text: string; link: string; is_active: boolean; display_order: number };

type Settings = {
    book_price: number;
    qr_code_path: string;
    book_cover_path: string;
    whatsapp_number: string;
    maintenance_mode: boolean;
    meta_title: string;
    meta_description: string;
    google_analytics_id: string;
    google_search_console_tag: string;
    fb_pixel_id: string;
    announcement_bar: string;
    announcement_active: boolean;
    announcement_link?: string;
    facebook_url: string;
    author_email: string;
    author_website: string;
    author_image_path: string;
    author_details: AuthorDetails | null;
    book_sections: BookSection[] | null;
};

const DEFAULT_AUTHOR: AuthorDetails = {
    name: "Er. Sailesh Acharya",
    experience: "15+ Years",
    roles: [
        { text: "Chairman, RKD Holdings Ltd.", link: "https://rkdholdings.com" },
        { text: "Director, BizBazar Ltd.", link: "https://bizbazar.com.np" },
        { text: "Director, Tourism Investment Fund", link: "" },
    ],
    description:
        "Decoding the Words is rooted in over a decade and a half of practical experience in technology, entrepreneurship, and continuous learning. The principles shared are not just theory—they are the exact disciplined steps used to build multiple successful ventures.",
};

const DEFAULT_SECTIONS: BookSection[] = [
    { id: "SECTION-1", titleEn: "Social Trap", titleNp: "सामाजिक जालो" },
    { id: "SECTION-2", titleEn: "The W-O-R-D Framework", titleNp: "W-O-R-D ढाँचा" },
    { id: "SECTION-3", titleEn: "Procrastination & Persistence", titleNp: "ढिलाइ र परिश्रम" },
    { id: "SECTION-4", titleEn: "WORLD Equation", titleNp: "WORLD समीकरण" },
    { id: "SPECIAL", titleEn: "Additional Sections", titleNp: "थप खण्डहरू" },
];

const DEFAULT: Settings = {
    book_price: 499,
    qr_code_path: "",
    book_cover_path: "",
    whatsapp_number: "",
    maintenance_mode: false,
    meta_title: "Decoding the Words — शब्दले संसार बदल्छ",
    meta_description: "The motivational Nepali book that decodes how your words shape your world. Buy the digital license — NPR 499.",
    google_analytics_id: "",
    google_search_console_tag: "",
    fb_pixel_id: "",
    announcement_bar: "",
    announcement_active: false,
    announcement_link: "",
    facebook_url: "https://facebook.com/ersaileshacharya",
    author_email: "ersaileshacharya@gmail.com",
    author_website: "https://saileshacharya.com.np",
    author_image_path: "",
    author_details: null,
    book_sections: null,
};

const TABS = ["general", "marquee", "content", "coupons", "seo", "analytics", "social"] as const;
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Tab, string> = {
    general: "General",
    marquee: "Marquee",
    content: "Content",
    coupons: "Coupons",
    seo: "SEO",
    analytics: "Analytics",
    social: "Social",
};

function InputField({ label, value, onChange, type = "text", placeholder }: {
    label: string; value: string; onChange: (v: string) => void;
    type?: string; placeholder?: string;
}) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-bold text-navy">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-3 bg-offwhite border border-black/10 rounded-xl text-sm focus:border-gold outline-none"
            />
        </div>
    );
}

type Coupon = { id: string; code: string; discount_value: number; discount_type: "flat" | "percent"; is_active: boolean };

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<Settings>(DEFAULT);
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [deletedCouponIds, setDeletedCouponIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [qrFile, setQrFile] = useState<File | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [authorFile, setAuthorFile] = useState<File | null>(null);
    const [saved, setSaved] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>("general");
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [deletedAnnouncementIds, setDeletedAnnouncementIds] = useState<string[]>([]);

    // Derived helpers for author_details and book_sections
    const author = settings.author_details ?? DEFAULT_AUTHOR;
    const sections = settings.book_sections ?? DEFAULT_SECTIONS;

    const setAuthor = (patch: Partial<AuthorDetails>) =>
        setSettings((s) => ({ ...s, author_details: { ...(s.author_details ?? DEFAULT_AUTHOR), ...patch } }));

    const setSections = (sections: BookSection[]) =>
        setSettings((s) => ({ ...s, book_sections: sections }));

    const updateSection = (index: number, patch: Partial<BookSection>) => {
        const next = sections.map((sec, i) => (i === index ? { ...sec, ...patch } : sec));
        setSections(next);
    };

    const addSection = () => {
        setSections([...sections, { id: `SECTION-${Date.now()}`, titleEn: "", titleNp: "" }]);
    };

    const removeSection = (index: number) => {
        setSections(sections.filter((_, i) => i !== index));
    };

    const updateRole = (index: number, value: string, field: 'text' | 'link' = 'text') => {
        const newRoles = [...(author.roles ?? [])];
        const currentRole = newRoles[index];

        // Ensure currentRole is an object before spreading
        const roleObject = typeof currentRole === 'string' ? { text: currentRole, link: '' } : currentRole;

        newRoles[index] = { ...roleObject, [field]: value };

        setAuthor({ roles: newRoles });
    };

    const addRole = () => {
        const newRoles = [...(author.roles ?? []), { text: "", link: "" }];
        setAuthor({ roles: newRoles });
    };

    const removeRole = (index: number) => {
        setAuthor({ roles: author.roles.filter((_, i) => i !== index) });
    };

    // Coupon Helpers
    const addCoupon = () => {
        setCoupons([...coupons, { id: `new-${Date.now()}`, code: "", discount_value: 0, discount_type: "flat", is_active: true }]);
    };

    const updateCoupon = (index: number, patch: Partial<Coupon>) => {
        setCoupons(coupons.map((c, i) => (i === index ? { ...c, ...patch } : c)));
    };

    const removeCoupon = (index: number) => {
        const coupon = coupons[index];
        if (!coupon.id.startsWith("new-")) {
            setDeletedCouponIds([...deletedCouponIds, coupon.id]);
        }
        setCoupons(coupons.filter((_, i) => i !== index));
    };

    // Announcement Helpers
    const addAnnouncement = () => {
        setAnnouncements([...announcements, { id: `new-${Date.now()}`, text: "", link: "", is_active: true, display_order: announcements.length }]);
    };

    const updateAnnouncement = (index: number, patch: Partial<Announcement>) => {
        setAnnouncements(announcements.map((a, i) => (i === index ? { ...a, ...patch } : a)));
    };

    const removeAnnouncement = (index: number) => {
        const announcement = announcements[index];
        if (!announcement.id.startsWith("new-")) {
            setDeletedAnnouncementIds([...deletedAnnouncementIds, announcement.id]);
        }
        setAnnouncements(announcements.filter((_, i) => i !== index));
    };

    useEffect(() => {
        const fetchData = async () => {
            const { data: settingsData } = await supabase.from("settings").select("*").eq("id", 1).single();
            if (settingsData) setSettings({ ...DEFAULT, ...settingsData });

            const { data: couponData } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
            if (couponData) setCoupons(couponData as Coupon[]);

            const { data: announcementsData } = await supabase.from("announcements").select("*").order("display_order", { ascending: true });
            if (announcementsData) setAnnouncements(announcementsData as Announcement[]);

            setLoading(false);
        };
        fetchData();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        setSaveError(null);

        let qrPath = settings.qr_code_path;
        let coverPath = settings.book_cover_path;
        let authorPath = settings.author_image_path;

        if (qrFile) {
            const ext = qrFile.name.split(".").pop();
            const path = `qr-code-${Date.now()}.${ext}`;
            const { error: uploadErr } = await supabase.storage
                .from("assets")
                .upload(path, qrFile, { upsert: true });

            if (uploadErr) {
                console.error("Storage upload error (QR):", uploadErr);
                setSaveError(`QR Upload failed: ${uploadErr.message}`);
                setSaving(false);
                return;
            }
            qrPath = path;
        }

        if (coverFile) {
            const ext = coverFile.name.split(".").pop();
            const path = `book-cover-${Date.now()}.${ext}`;
            const { error: uploadErr } = await supabase.storage
                .from("assets")
                .upload(path, coverFile, { upsert: true });

            if (uploadErr) {
                console.error("Storage upload error (Cover):", uploadErr);
                setSaveError(`Cover Upload failed: ${uploadErr.message}`);
                setSaving(false);
                return;
            }
            coverPath = path;
        }

        if (authorFile) {
            const ext = authorFile.name.split(".").pop();
            const path = `author-${Date.now()}.${ext}`;
            const { error: uploadErr } = await supabase.storage
                .from("assets")
                .upload(path, authorFile, { upsert: true });

            if (uploadErr) {
                console.error("Storage upload error (Author):", uploadErr);
                setSaveError(`Author Image Upload failed: ${uploadErr.message}`);
                setSaving(false);
                return;
            }
            authorPath = path;
        }

        // 1. Save Settings
        const { error: settingsError } = await supabase
            .from("settings")
            .upsert({
                id: 1,
                ...settings,
                qr_code_path: qrPath,
                book_cover_path: coverPath,
                author_image_path: authorPath
            });

        if (settingsError) {
            console.error("Database save error (settings):", settingsError);
            setSaveError(settingsError.message);
            setSaving(false);
            return;
        }

        // 2. Handle Coupon Deletions
        if (deletedCouponIds.length > 0) {
            const { error: delError } = await supabase.from("coupons").delete().in("id", deletedCouponIds);
            if (delError) console.error("Coupon deletion error:", delError);
        }

        // 3. Upsert Coupons
        const couponsToSave = coupons.map(c => {
            const { id, ...rest } = c;
            return id.startsWith("new-") ? rest : c;
        });

        if (couponsToSave.length > 0) {
            const { error: couponError } = await supabase.from("coupons").upsert(couponsToSave);
            if (couponError) {
                console.error("Coupon save error:", couponError);
                setSaveError(`Coupon save error: ${couponError.message}`);
                setSaving(false);
                return;
            }
        }

        // Refresh to get real IDs for new coupons
        const { data: freshCoupons } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
        if (freshCoupons) setCoupons(freshCoupons as Coupon[]);

        // 4. Handle Announcement Deletions
        if (deletedAnnouncementIds.length > 0) {
            const { error: delError } = await supabase.from("announcements").delete().in("id", deletedAnnouncementIds);
            if (delError) console.error("Announcement deletion error:", delError);
        }

        // 5. Upsert Announcements
        const announcementsToSave = announcements.map(a => {
            const { id, ...rest } = a;
            return id.startsWith("new-") ? rest : a;
        });

        if (announcementsToSave.length > 0) {
            const { error: annError } = await supabase.from("announcements").upsert(announcementsToSave);
            if (annError) {
                console.error("Announcement save error:", annError);
                setSaveError(`Announcement save error: ${annError.message}`);
                setSaving(false);
                return;
            }
        }

        // Refresh announcements
        const { data: freshAnnouncements } = await supabase.from("announcements").select("*").order("display_order", { ascending: true });
        if (freshAnnouncements) setAnnouncements(freshAnnouncements as Announcement[]);

        setSaving(false);
        setSaved(true);
        setSettings(s => ({ ...s, qr_code_path: qrPath, book_cover_path: coverPath, author_image_path: authorPath }));
        setQrFile(null);
        setCoverFile(null);
        setAuthorFile(null);
        setDeletedCouponIds([]);
        setSaveError(null);
        setTimeout(() => setSaved(false), 3000);
    };

    const set = (key: keyof Settings, val: unknown) => setSettings((s) => ({ ...s, [key]: val }));

    if (loading) {
        return <div className="flex justify-center py-24"><Loader2 className="w-7 h-7 animate-spin text-gold" /></div>;
    }

    return (
        <div className="max-w-3xl">
            {/* Sticky header */}
            <div className="sticky top-0 z-30 bg-[#F4F5F9] px-8 pt-8 pb-3">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-2xl font-heading font-bold text-navy">Site Settings</h1>
                        <p className="text-black/50 font-medium mt-1">Manage book pricing, SEO, analytics and more.</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`flex items-center gap-2 font-bold px-6 py-3 rounded-xl transition-all shadow-md ${saved ? "bg-green-500 text-white"
                            : saveError ? "bg-red-500 text-white"
                                : "bg-navy hover:bg-navy/90 text-white disabled:opacity-60"
                            }`}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saved ? "Saved!" : saving ? "Saving..." : saveError ? "Error!" : "Save Settings"}
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-white rounded-xl border border-black/5 p-1 shadow-sm overflow-x-auto">
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2.5 text-sm font-bold rounded-lg capitalize transition-all whitespace-nowrap ${activeTab === tab ? "bg-navy text-white shadow-md" : "text-black/50 hover:text-navy"
                                }`}
                        >
                            {TAB_LABELS[tab]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-8 pb-8">
                {/* Save Error Banner */}
                {saveError && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-sm font-bold text-red-700">⚠️ Save failed:</p>
                        <p className="text-sm text-red-600 mt-1 font-mono">{saveError}</p>
                        {saveError.includes("column") && (
                            <p className="text-sm text-red-700 mt-2 font-semibold">
                                👉 Please run the SQL migration first! Open Supabase → SQL Editor → run <code className="bg-red-100 px-1 rounded">dynamic_sections_update.sql</code>
                            </p>
                        )}
                        {saveError.toLowerCase().includes("upload") && (
                            <p className="text-sm text-red-700 mt-2 font-semibold">
                                👉 Storage Permissions Issue! Open Supabase → SQL Editor → run the contents of <code className="bg-red-100 px-1 rounded">fix_storage_permissions.sql</code>
                            </p>
                        )}
                    </div>
                )}

                <div className="space-y-5">
                    {/* ───── GENERAL TAB ───── */}
                    {activeTab === "general" && (
                        <>
                            {/* Book Price & WhatsApp */}
                            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-black/40 mb-5">Book & Payment</h2>
                                <div className="grid md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-navy">Book Price (NPR)</label>
                                        <input
                                            type="number"
                                            value={settings.book_price}
                                            onChange={(e) => set("book_price", parseInt(e.target.value))}
                                            className="w-full px-4 py-3 bg-offwhite border border-black/10 rounded-xl text-sm focus:border-gold outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-navy">WhatsApp Number</label>
                                        <input
                                            type="text"
                                            value={settings.whatsapp_number}
                                            onChange={(e) => set("whatsapp_number", e.target.value)}
                                            placeholder="+977..."
                                            className="w-full px-4 py-3 bg-offwhite border border-black/10 rounded-xl text-sm focus:border-gold outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Book Cover and QR Code */}
                                <div className="grid md:grid-cols-2 gap-8 mt-6">
                                    {/* Book Cover Upload */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-navy">Book Cover Image</label>
                                        {(coverFile || settings.book_cover_path) && (
                                            <div className="mt-2 mb-4 p-2 border border-black/10 rounded-xl bg-offwhite inline-block w-full">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={coverFile ? URL.createObjectURL(coverFile) : supabase.storage.from("assets").getPublicUrl(settings.book_cover_path).data.publicUrl}
                                                    alt="Cover Preview"
                                                    className="h-48 w-full object-contain mx-auto"
                                                />
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3">
                                            <label className="flex items-center gap-2 font-bold text-sm bg-offwhite border border-black/10 w-full px-4 py-2.5 rounded-xl cursor-pointer hover:border-gold transition-colors justify-center">
                                                <Upload className="w-4 h-4 text-gold" />
                                                {coverFile ? coverFile.name : "Upload Cover Image"}
                                                <input type="file" accept="image/*" className="sr-only" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
                                            </label>
                                        </div>
                                        <p className="text-[10px] text-black/40 mt-1 italic">Recommended size: 800x1200 (2:3 aspect ratio)</p>
                                    </div>

                                    {/* QR Code Upload */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-navy">QR Code Image</label>
                                        {((qrFile || settings.qr_code_path) && (qrFile || settings.qr_code_path !== "")) && (
                                            <div className="mt-2 mb-4 p-2 border border-black/10 rounded-xl bg-offwhite inline-block w-full">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={qrFile ? URL.createObjectURL(qrFile) : supabase.storage.from("assets").getPublicUrl(settings.qr_code_path).data.publicUrl}
                                                    alt="QR Preview"
                                                    className="h-48 w-full object-contain mx-auto"
                                                />
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3">
                                            <label className="flex items-center gap-2 font-bold text-sm bg-offwhite border border-black/10 w-full px-4 py-2.5 rounded-xl cursor-pointer hover:border-gold transition-colors justify-center">
                                                <Upload className="w-4 h-4 text-gold" />
                                                {qrFile ? qrFile.name : "Upload QR Code"}
                                                <input type="file" accept="image/*" className="sr-only" onChange={(e) => setQrFile(e.target.files?.[0] || null)} />
                                            </label>
                                        </div>
                                        <p className="text-[10px] text-black/40 mt-1 italic">Scan to pay QR (eSewa/Khalti)</p>
                                    </div>
                                </div>
                            </div>

                            {/* Announcement Bar */}
                            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-black/40 mb-5">Announcement Bar</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => set("announcement_active", !settings.announcement_active)}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${settings.announcement_active ? "bg-green-500" : "bg-black/20"}`}
                                        >
                                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${settings.announcement_active ? "translate-x-7" : "translate-x-1"}`} />
                                        </button>
                                        <label className="text-sm font-bold text-navy">Show Announcement Bar</label>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-navy">Announcement Text</label>
                                        <input
                                            type="text"
                                            value={settings.announcement_bar}
                                            onChange={(e) => set("announcement_bar", e.target.value)}
                                            placeholder="e.g. 🎉 Launch offer: Get the book for NPR 399 — use code LAUNCH"
                                            className="w-full px-4 py-3 bg-offwhite border border-black/10 rounded-xl text-sm focus:border-gold outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-navy">Target URL (Optional)</label>
                                        <input
                                            type="text"
                                            value={settings.announcement_link || ""}
                                            onChange={(e) => set("announcement_link", e.target.value)}
                                            placeholder="e.g. /buy or #contact-us"
                                            className="w-full px-4 py-3 bg-offwhite border border-black/10 rounded-xl text-sm focus:border-gold outline-none"
                                        />
                                        <p className="text-[10px] text-black/40 mt-1 italic">Internal links: /path | External: https://... | In-page: #id</p>
                                    </div>
                                </div>
                            </div>

                            {/* Maintenance */}
                            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="font-bold text-navy">Maintenance Mode</h2>
                                        <p className="text-sm text-black/50 mt-0.5">Temporarily take the site offline for visitors</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => set("maintenance_mode", !settings.maintenance_mode)}
                                        className={`w-14 h-7 rounded-full transition-colors relative ${settings.maintenance_mode ? "bg-red-500" : "bg-black/20"}`}
                                    >
                                        <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.maintenance_mode ? "translate-x-8" : "translate-x-1"}`} />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ───── MARQUEE / ANNOUNCEMENTS TAB ───── */}
                    {activeTab === "marquee" && (
                        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 space-y-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-bold uppercase tracking-widest text-black/40">Marquee Announcements</h2>
                                    <p className="text-xs text-black/40 mt-1">
                                        Manage scrolling messages shown at the top of the site.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={addAnnouncement}
                                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-navy bg-offwhite border border-black/10 rounded-xl hover:border-gold transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Announcement
                                </button>
                            </div>

                            <div className="space-y-4">
                                {announcements.length === 0 && (
                                    <p className="text-center py-8 text-black/30 text-sm font-medium">No announcements yet.</p>
                                )}
                                {announcements.map((ann, i) => (
                                    <div
                                        key={ann.id}
                                        className={`flex flex-col gap-3 bg-offwhite rounded-xl p-4 border transition-all ${ann.is_active ? "border-black/5" : "border-red-100 opacity-60"}`}
                                    >
                                        <div className="flex flex-col md:flex-row gap-3">
                                            <div className="flex-1 space-y-1">
                                                <label className="text-[10px] font-bold text-navy/40 uppercase">Announcement Text</label>
                                                <input
                                                    type="text"
                                                    value={ann.text}
                                                    onChange={(e) => updateAnnouncement(i, { text: e.target.value })}
                                                    placeholder="Enter announcement message..."
                                                    className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-sm focus:border-gold outline-none"
                                                />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <label className="text-[10px] font-bold text-navy/40 uppercase">Target URL (Optional)</label>
                                                <input
                                                    type="text"
                                                    value={ann.link}
                                                    onChange={(e) => updateAnnouncement(i, { link: e.target.value })}
                                                    placeholder="/buy, #contact, etc."
                                                    className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-sm focus:border-gold outline-none"
                                                />
                                            </div>
                                            <div className="flex items-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => updateAnnouncement(i, { is_active: !ann.is_active })}
                                                    className={`flex-1 md:w-24 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${ann.is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`}
                                                >
                                                    {ann.is_active ? "Active" : "Disabled"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAnnouncement(i)}
                                                    className="p-2 text-black/30 hover:text-red-500 transition-colors bg-white border border-black/10 rounded-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 bg-gold/10 border border-gold/20 rounded-xl">
                                <p className="text-xs text-navy font-medium italic">
                                    💡 Tip: You can toggle multiple announcements and they will scroll sequentially in the marquee!
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ───── CONTENT TAB ───── */}
                    {activeTab === "content" && (
                        <>
                            {/* Author Details */}
                            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 space-y-5">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-black/40">Author Details</h2>
                                <p className="text-xs text-black/40 -mt-3">
                                    These details appear in the footer, Who We Are page, and book credits.
                                </p>

                                <div className="grid md:grid-cols-2 gap-5">
                                    <InputField
                                        label="Author Name"
                                        value={author.name}
                                        onChange={(v) => setAuthor({ name: v })}
                                        placeholder="Er. Sailesh Acharya"
                                    />
                                    <InputField
                                        label="Years of Experience"
                                        value={author.experience}
                                        onChange={(v) => setAuthor({ experience: v })}
                                        placeholder="15+ Years"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-navy">Bio / Description</label>
                                    <textarea
                                        rows={4}
                                        value={author.description}
                                        onChange={(e) => setAuthor({ description: e.target.value })}
                                        placeholder="Write a short bio about the author..."
                                        className="w-full px-4 py-3 bg-offwhite border border-black/10 rounded-xl text-sm focus:border-gold outline-none resize-none"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-navy">Roles / Titles</label>
                                        <button
                                            type="button"
                                            onClick={addRole}
                                            className="flex items-center gap-1.5 text-xs font-bold text-gold hover:text-gold/70 transition-colors"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Add Role
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {(author.roles ?? []).map((role, i) => {
                                            const roleObj = typeof role === 'string' ? { text: role, link: '' } : role;
                                            return (
                                                <div key={i} className="flex flex-col gap-2 p-3 bg-offwhite rounded-xl border border-black/5 relative group">
                                                    <div className="flex items-center gap-2">
                                                        <GripVertical className="w-4 h-4 text-black/20 flex-shrink-0" />
                                                        <div className="flex-1 space-y-2">
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] font-bold text-navy/40 uppercase">Role / Title</label>
                                                                <input
                                                                    type="text"
                                                                    value={roleObj.text}
                                                                    onChange={(e) => updateRole(i, e.target.value, 'text')}
                                                                    placeholder={`e.g. CEO at Company`}
                                                                    className="w-full px-4 py-2 bg-white border border-black/10 rounded-lg text-sm focus:border-gold outline-none"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] font-bold text-navy/40 uppercase">Link (Optional)</label>
                                                                <input
                                                                    type="text"
                                                                    value={roleObj.link}
                                                                    onChange={(e) => updateRole(i, e.target.value, 'link')}
                                                                    placeholder="https://..."
                                                                    className="w-full px-4 py-2 bg-white border border-black/10 rounded-lg text-[11px] focus:border-gold outline-none"
                                                                />
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeRole(i)}
                                                            className="p-2 text-black/30 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Author Photo Upload */}
                                <div className="pt-4 border-t border-black/5 space-y-3">
                                    <label className="text-sm font-bold text-navy block">Author Photo</label>
                                    {(authorFile || settings.author_image_path) && (
                                        <div className="p-3 border border-black/10 rounded-xl bg-offwhite inline-block w-full max-w-xs">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={authorFile ? URL.createObjectURL(authorFile) : supabase.storage.from("assets").getPublicUrl(settings.author_image_path).data.publicUrl}
                                                alt="Author Preview"
                                                className="h-48 w-full object-cover rounded-lg"
                                            />
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <label className="flex items-center gap-2 font-bold text-sm bg-offwhite border border-black/10 w-full max-w-xs px-4 py-2.5 rounded-xl cursor-pointer hover:border-gold transition-colors justify-center">
                                            <Upload className="w-4 h-4 text-gold" />
                                            {authorFile ? authorFile.name : "Upload Author Photo"}
                                            <input type="file" accept="image/*" className="sr-only" onChange={(e) => setAuthorFile(e.target.files?.[0] || null)} />
                                        </label>
                                    </div>
                                    <p className="text-[10px] text-black/40 italic">Best with a portrait photo (aspect ratio 4:5 or 1:1)</p>
                                </div>
                            </div>

                            {/* Book Sections */}
                            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 space-y-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-sm font-bold uppercase tracking-widest text-black/40">Book Sections</h2>
                                        <p className="text-xs text-black/40 mt-1">
                                            These sections group chapters in the reader and the Chapters Index page.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addSection}
                                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-navy bg-offwhite border border-black/10 rounded-xl hover:border-gold transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Add Section
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {sections.map((section, i) => (
                                        <div
                                            key={section.id}
                                            className="flex items-center gap-3 bg-offwhite rounded-xl p-3 border border-black/5"
                                        >
                                            <GripVertical className="w-4 h-4 text-black/20 flex-shrink-0" />
                                            <div className="flex-1 grid grid-cols-2 gap-3">
                                                <input
                                                    type="text"
                                                    value={section.titleEn}
                                                    onChange={(e) => updateSection(i, { titleEn: e.target.value })}
                                                    placeholder="English Title"
                                                    className="px-3 py-2 bg-white border border-black/10 rounded-lg text-sm focus:border-gold outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    value={section.titleNp}
                                                    onChange={(e) => updateSection(i, { titleNp: e.target.value })}
                                                    placeholder="नेपाली शीर्षक"
                                                    className="px-3 py-2 bg-white border border-black/10 rounded-lg text-sm focus:border-gold outline-none"
                                                    style={{ fontFamily: "'Hind Siliguri', sans-serif" }}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeSection(i)}
                                                className="p-2 text-black/30 hover:text-red-500 transition-colors flex-shrink-0"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-3 bg-gold/10 border border-gold/20 rounded-xl">
                                    <p className="text-xs text-navy font-medium">
                                        💡 Sections are saved as JSON in Supabase. No rebuild needed — changes go live immediately!
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ───── COUPONS TAB ───── */}
                    {activeTab === "coupons" && (
                        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 space-y-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-bold uppercase tracking-widest text-black/40">Discount Coupons</h2>
                                    <p className="text-xs text-black/40 mt-1">
                                        Create codes to give discounts to your readers.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={addCoupon}
                                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-navy bg-offwhite border border-black/10 rounded-xl hover:border-gold transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Coupon
                                </button>
                            </div>

                            <div className="space-y-4">
                                {coupons.length === 0 && (
                                    <p className="text-center py-8 text-black/30 text-sm font-medium">No coupons created yet.</p>
                                )}
                                {coupons.map((coupon, i) => (
                                    <div
                                        key={coupon.id}
                                        className={`flex flex-col md:flex-row gap-3 bg-offwhite rounded-xl p-4 border transition-all ${coupon.is_active ? "border-black/5" : "border-red-100 opacity-60"}`}
                                    >
                                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-navy/40 uppercase">Code</label>
                                                <input
                                                    type="text"
                                                    value={coupon.code}
                                                    onChange={(e) => updateCoupon(i, { code: e.target.value.toUpperCase().replace(/\s/g, "") })}
                                                    placeholder="e.g. SAVE50"
                                                    className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-sm font-bold focus:border-gold outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-navy/40 uppercase">Value</label>
                                                <input
                                                    type="number"
                                                    value={coupon.discount_value}
                                                    onChange={(e) => updateCoupon(i, { discount_value: parseInt(e.target.value) || 0 })}
                                                    className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-sm focus:border-gold outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-navy/40 uppercase">Type</label>
                                                <select
                                                    value={coupon.discount_type}
                                                    onChange={(e) => updateCoupon(i, { discount_type: e.target.value as "flat" | "percent" })}
                                                    className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-sm focus:border-gold outline-none"
                                                >
                                                    <option value="flat">NPR (Flat)</option>
                                                    <option value="percent">% (Percent)</option>
                                                </select>
                                            </div>
                                            <div className="flex items-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => updateCoupon(i, { is_active: !coupon.is_active })}
                                                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${coupon.is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`}
                                                >
                                                    {coupon.is_active ? "Active" : "Inactive"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeCoupon(i)}
                                                    className="p-2 text-black/30 hover:text-red-500 transition-colors bg-white border border-black/10 rounded-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                <p className="text-xs text-blue-700 font-medium">
                                    💡 Coupon codes are matched case-insensitively. &quot;SAVE100&quot; is the same as &quot;save100&quot;.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ───── SEO TAB ───── */}
                    {activeTab === "seo" && (
                        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 space-y-5">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-black/40">Search Engine Optimization</h2>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-navy">Meta Title</label>
                                <input
                                    type="text"
                                    value={settings.meta_title}
                                    onChange={(e) => set("meta_title", e.target.value)}
                                    className="w-full px-4 py-3 bg-offwhite border border-black/10 rounded-xl text-sm focus:border-gold outline-none"
                                />
                                <p className="text-xs text-black/40">{settings.meta_title.length}/60 characters (recommended max)</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-navy">Meta Description</label>
                                <textarea
                                    rows={3}
                                    value={settings.meta_description}
                                    onChange={(e) => set("meta_description", e.target.value)}
                                    className="w-full px-4 py-3 bg-offwhite border border-black/10 rounded-xl text-sm focus:border-gold outline-none resize-none"
                                />
                                <p className="text-xs text-black/40">{settings.meta_description.length}/160 characters (recommended max)</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-navy">Google Search Console Verification Tag</label>
                                <input
                                    type="text"
                                    value={settings.google_search_console_tag}
                                    onChange={(e) => set("google_search_console_tag", e.target.value)}
                                    placeholder="e.g. abc123xyz..."
                                    className="w-full px-4 py-3 bg-offwhite border border-black/10 rounded-xl text-sm font-mono focus:border-gold outline-none"
                                />
                                <p className="text-xs text-black/40">Paste the content value from the meta tag verification method</p>
                            </div>
                        </div>
                    )}

                    {/* ───── ANALYTICS TAB ───── */}
                    {activeTab === "analytics" && (
                        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 space-y-5">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-black/40">Analytics & Tracking Codes</h2>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-navy">Google Analytics Measurement ID</label>
                                <input
                                    type="text"
                                    value={settings.google_analytics_id}
                                    onChange={(e) => set("google_analytics_id", e.target.value)}
                                    placeholder="G-XXXXXXXXXX"
                                    className="w-full px-4 py-3 bg-offwhite border border-black/10 rounded-xl text-sm font-mono focus:border-gold outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-navy">Facebook Pixel ID</label>
                                <input
                                    type="text"
                                    value={settings.fb_pixel_id}
                                    onChange={(e) => set("fb_pixel_id", e.target.value)}
                                    placeholder="1234567890"
                                    className="w-full px-4 py-3 bg-offwhite border border-black/10 rounded-xl text-sm font-mono focus:border-gold outline-none"
                                />
                            </div>
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                <p className="text-sm text-blue-700 font-semibold">
                                    📊 After saving, these IDs will automatically be injected into your site&apos;s &lt;head&gt; for tracking.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ───── SOCIAL TAB ───── */}
                    {activeTab === "social" && (
                        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 space-y-5">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-black/40">Author & Social Links</h2>

                            <InputField
                                label="Facebook Profile/Page URL"
                                value={settings.facebook_url}
                                onChange={(v) => set("facebook_url", v)}
                                type="url"
                                placeholder="https://facebook.com/..."
                            />
                            <InputField
                                label="Public Email Address"
                                value={settings.author_email}
                                onChange={(v) => set("author_email", v)}
                                type="email"
                                placeholder="email@example.com"
                            />
                            <InputField
                                label="Personal Website URL"
                                value={settings.author_website}
                                onChange={(v) => set("author_website", v)}
                                type="url"
                                placeholder="https://..."
                            />

                            <div className="p-4 bg-gold/10 border border-gold/20 rounded-xl mt-4">
                                <p className="text-sm text-navy font-medium">
                                    💡 These links will automatically be updated in the site&apos;s footer.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
