"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
    Download, 
    Database, 
    FileJson, 
    ShieldCheck, 
    AlertCircle, 
    Loader2, 
    CheckCircle2,
    BookOpen,
    Users,
    Inbox,
    Settings as SettingsIcon,
    Star,
    Bell,
    PenTool
} from "lucide-react";

const TABLES = [
    { id: "book_content", label: "Book Content", icon: BookOpen, description: "All chapters, sections, and lesson blocks." },
    { id: "users", label: "Users & Licenses", description: "All registered readers and their license status.", icon: Users },
    { id: "submissions", label: "Payment Submissions", description: "Verification proofs, coupons, and status history.", icon: Inbox },
    { id: "settings", label: "Site Settings", description: "Pricing, SEO, social links, and book metadata.", icon: SettingsIcon },
    { id: "testimonials", label: "Testimonials", description: "Reader reviews and feedback content.", icon: Star },
    { id: "announcements", label: "Announcements", description: "Top bar messages and active alerts.", icon: Bell },
    { id: "user_reflections", label: "User Reflections", description: "Private journal entries and reflection notes.", icon: PenTool },
];

export default function BackupPage() {
    const [loading, setLoading] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const downloadJson = (data: any, identifier: string) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `decoding-backup-${identifier}-${timestamp}.json`;
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleBackupTable = async (tableId: string) => {
        setLoading(tableId);
        setError(null);
        setSuccess(null);

        try {
            const { data, error: fetchErr } = await supabase
                .from(tableId)
                .select("*");

            if (fetchErr) throw fetchErr;

            downloadJson(data, tableId);
            setSuccess(`Exported ${tableId} successfully!`);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            console.error(err);
            setError(`Failed to export ${tableId}: ${err.message}`);
        } finally {
            setLoading(null);
        }
    };

    const handleFullBackup = async () => {
        setLoading("full");
        setError(null);
        setSuccess(null);

        try {
            const fullData: Record<string, any> = {};
            
            for (const table of TABLES) {
                const { data, error: fetchErr } = await supabase
                    .from(table.id)
                    .select("*");
                
                if (fetchErr) {
                    console.warn(`Could not backup ${table.id}:`, fetchErr.message);
                    fullData[table.id] = { error: fetchErr.message };
                } else {
                    fullData[table.id] = data;
                }
            }

            downloadJson(fullData, "FULL-DATABASE");
            setSuccess("Full database backup completed!");
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            console.error(err);
            setError(`Full backup failed: ${err.message}`);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gold/10 rounded-lg">
                            <Database className="w-6 h-6 text-gold" />
                        </div>
                        <h1 className="text-3xl font-heading font-black text-navy tracking-tight">Data Backup & Export</h1>
                    </div>
                    <p className="text-black/50 font-medium max-w-xl">
                        Export your entire website content and user data to secure JSON files. 
                        It is recommended to perform a full backup before making major content updates.
                    </p>
                </div>
                
                <button
                    onClick={handleFullBackup}
                    disabled={!!loading}
                    className="flex items-center gap-3 bg-navy text-white px-8 py-4 rounded-2xl font-black transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-navy/20 disabled:opacity-50"
                >
                    {loading === "full" ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Download className="w-5 h-5" />
                    )}
                    {loading === "full" ? "Preparing Backup..." : "Full Database Backup"}
                </button>
            </div>

            {error && (
                <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 animate-shake">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-bold">{error}</span>
                </div>
            )}

            {success && (
                <div className="mb-8 p-4 bg-green-50 border border-green-100 text-green-700 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-bold">{success}</span>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                {TABLES.map((table) => (
                    <div 
                        key={table.id}
                        className="bg-white rounded-3xl border border-black/5 p-6 hover:shadow-xl hover:shadow-black/5 transition-all group flex flex-col justify-between"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-[#F4F5F9] border border-black/5 flex items-center justify-center text-navy/40 group-hover:text-gold transition-colors">
                                    <table.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-heading font-bold text-lg text-navy">{table.label}</h3>
                                    <p className="text-xs text-black/30 font-mono mt-0.5">{table.id}</p>
                                </div>
                            </div>
                            <div className="p-2 bg-green-500/5 rounded-full">
                                <ShieldCheck className="w-4 h-4 text-green-500/40" />
                            </div>
                        </div>
                        
                        <p className="text-sm text-black/50 font-medium leading-relaxed mb-6">
                            {table.description}
                        </p>

                        <button
                            onClick={() => handleBackupTable(table.id)}
                            disabled={!!loading}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#F4F5F9] text-navy font-bold rounded-2xl hover:bg-gold hover:text-navy transition-all active:scale-95 disabled:opacity-30 group"
                        >
                            {loading === table.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <FileJson className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            )}
                            {loading === table.id ? "Exporting..." : "Export as JSON"}
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-16 p-8 bg-gold/5 border-2 border-dashed border-gold/20 rounded-[2.5rem] flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center text-gold mb-6">
                    <Database className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-heading font-black text-navy mb-2">Restoration Note</h2>
                <p className="text-sm text-black/40 font-medium max-w-lg">
                    These JSON files contain raw row data from your database. To restore, you can use the Supabase CSV/JSON import feature in the dashboard or an automated script. Always keep these files in a secure, private location as they include user emails and content.
                </p>
            </div>
        </div>
    );
}
