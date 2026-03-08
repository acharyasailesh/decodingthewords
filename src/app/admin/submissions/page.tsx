"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Check, X, Eye, Loader2, Search, Tag } from "lucide-react";

type Submission = {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: "pending" | "approved" | "rejected";
    reference_number: string;
    submitted_at: string;
    screenshot_path: string;
    coupon_used: string | null;
    final_amount: number | null;
    rejection_reason: string | null;
};

export default function AdminSubmissionsPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
    const [search, setSearch] = useState("");
    const [selectedImg, setSelectedImg] = useState<string | null>(null);
    const [updating, setUpdating] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [rejectingSub, setRejectingSub] = useState<Submission | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3500);
    };

    const fetchSubmissions = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from("submissions")
                .select("*")
                .order("submitted_at", { ascending: false });
            if (data) setSubmissions(data as Submission[]);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);

    const updateStatus = async (sub: Submission, newStatus: "approved" | "rejected", reason?: string) => {
        setUpdating(sub.id);
        if (newStatus === "approved") {
            try {
                const res = await fetch('/api/admin/invite-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: sub.email, name: sub.name, submissionId: sub.id }),
                });
                const result = await res.json();
                if (result.success) {
                    setSubmissions((prev) =>
                        prev.map((s) => (s.id === sub.id ? { ...s, status: newStatus } : s))
                    );
                    showToast(`✅ ${sub.name} approved and invited!`);
                } else {
                    showToast(`❌ Error: ${result.error}`);
                }
            } catch (e) {
                showToast(`❌ Network error: ${String(e)}`);
            } finally {
                setUpdating(null);
            }
            return;
        }

        // For rejection
        try {
            const { error } = await supabase
                .from("submissions")
                .update({
                    status: newStatus,
                    reviewed_at: new Date().toISOString(),
                    rejection_reason: reason || null
                })
                .eq("id", sub.id);

            if (!error) {
                setSubmissions((prev) =>
                    prev.map((s) => (s.id === sub.id ? { ...s, status: newStatus, rejection_reason: reason || null } : s))
                );

                // Send rejection email
                const emailRes = await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'license_rejected',
                        name: sub.name,
                        email: sub.email,
                        referenceNumber: sub.reference_number,
                        reason: reason
                    }),
                });

                if (emailRes.ok) {
                    showToast(`✅ Submission rejected and user notified`);
                } else {
                    const emailErr = await emailRes.json();
                    showToast(`⚠️ Rejected in DB, but Email Failed: ${emailErr.details || 'Check Resend'}`);
                }
            } else {
                showToast(`❌ DB Error: ${error.message}`);
            }
        } catch (e) {
            showToast(`❌ Error: ${String(e)}`);
        } finally {
            setUpdating(null);
        }
    };

    const getImageUrl = (path: string) => {
        const { data } = supabase.storage.from("screenshots").getPublicUrl(path);
        return data.publicUrl;
    };

    const filtered = submissions.filter((s) => {
        const matchFilter = filter === "all" || s.status === filter;
        const matchSearch =
            search === "" ||
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.email.toLowerCase().includes(search.toLowerCase()) ||
            s.reference_number.toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
    });

    const counts = {
        all: submissions.length,
        pending: submissions.filter((s) => s.status === "pending").length,
        approved: submissions.filter((s) => s.status === "approved").length,
        rejected: submissions.filter((s) => s.status === "rejected").length,
    };

    return (
        <div className="p-8 relative">
            {toast && (
                <div className="fixed top-6 right-6 z-50 bg-navy text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl animate-fade-in">
                    {toast}
                </div>
            )}
            <div className="mb-6">
                <h1 className="text-2xl font-heading font-bold text-navy">Payment Submissions</h1>
                <p className="text-black/50 font-medium mt-1">Review, approve or reject reader payment proofs.</p>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex gap-2 flex-wrap">
                    {(["all", "pending", "approved", "rejected"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${filter === f
                                ? "bg-navy text-white shadow-md"
                                : "bg-white text-black/50 border border-black/10 hover:border-navy"
                                }`}
                        >
                            {f} ({counts[f as keyof typeof counts]})
                        </button>
                    ))}
                </div>
                <div className="relative ml-auto w-full md:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
                    <input
                        type="text"
                        placeholder="Search by name, email or ref..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-black/10 rounded-xl focus:border-gold outline-none"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-gold" /></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#F4F5F9] border-b border-black/5 text-xs uppercase tracking-wider text-black/40">
                                    <th className="p-4 font-bold">Date / Ref</th>
                                    <th className="p-4 font-bold">Reader</th>
                                    <th className="p-4 font-bold">Amount</th>
                                    <th className="p-4 font-bold">Phone</th>
                                    <th className="p-4 font-bold">Proof</th>
                                    <th className="p-4 font-bold">Status</th>
                                    <th className="p-4 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                {filtered.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-[#F4F5F9]/50 transition-colors">
                                        <td className="p-4">
                                            <p className="text-sm font-medium text-navy">{new Date(sub.submitted_at).toLocaleDateString("en-NP")}</p>
                                            <p className="text-xs font-mono text-black/40 mt-0.5">{sub.reference_number}</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-semibold text-navy text-sm">{sub.name}</p>
                                            <div className="flex flex-col gap-1 mt-0.5">
                                                <p className="text-xs text-black/50">{sub.email}</p>
                                                {submissions.some(s => s.email === sub.email && s.status === 'approved' && s.id !== sub.id) && (
                                                    <span className="inline-flex w-fit items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 uppercase tracking-tighter">
                                                        ⚠️ Existing Approval
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm font-bold text-navy">NPR {sub.final_amount || 499}</p>
                                            {sub.coupon_used && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100 mt-1 uppercase">
                                                    <Tag className="w-2.5 h-2.5" /> {sub.coupon_used}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-black/60">{sub.phone}</td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => setSelectedImg(getImageUrl(sub.screenshot_path))}
                                                className="flex items-center gap-1.5 text-xs font-bold text-gold bg-gold/10 px-3 py-1.5 rounded-lg hover:bg-gold/20 transition-colors"
                                            >
                                                <Eye className="w-3.5 h-3.5" /> View
                                            </button>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase
                        ${sub.status === "pending" ? "bg-yellow-100 text-yellow-700" : ""}
                        ${sub.status === "approved" ? "bg-green-100 text-green-700" : ""}
                        ${sub.status === "rejected" ? "bg-red-100 text-red-600" : ""}
                      `}>
                                                {sub.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {sub.status === "pending" && (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        disabled={updating === sub.id}
                                                        onClick={() => updateStatus(sub, "approved")}
                                                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-green-700 bg-green-50 hover:bg-green-100 border border-green-100 disabled:opacity-50"
                                                    >
                                                        {updating === sub.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5" /> Approve</>}
                                                    </button>
                                                    <button
                                                        disabled={updating === sub.id}
                                                        onClick={() => {
                                                            setRejectingSub(sub);
                                                            setRejectionReason("");
                                                        }}
                                                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 disabled:opacity-50"
                                                    >
                                                        <X className="w-3.5 h-3.5" /> Reject
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-10 text-center text-sm text-black/40">
                                            No submissions match this filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Image Modal */}
            {selectedImg && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setSelectedImg(null)}>
                    <button className="absolute top-5 right-5 text-white/50 hover:text-white"><X className="w-8 h-8" /></button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedImg} alt="Payment proof" className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl" />
                </div>
            )}

            {/* Rejection Reason Modal */}
            {rejectingSub && (
                <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-navy mb-2">Reject Submission</h3>
                            <p className="text-sm text-black/50 mb-4">Provide a reason for rejecting <strong>{rejectingSub.name}&apos;s</strong> payment proof. They will be notified via email.</p>

                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="e.g. Transaction ID doesn't match, or Screenshot is blurry..."
                                className="w-full h-32 p-3 text-sm border border-black/10 rounded-xl focus:border-gold outline-none resize-none transition-all"
                                autoFocus
                            />
                        </div>
                        <div className="bg-offwhite p-4 flex gap-3 justify-end">
                            <button
                                onClick={() => setRejectingSub(null)}
                                className="px-5 py-2 text-xs font-bold text-black/50 hover:text-navy transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={updating === rejectingSub.id}
                                onClick={async () => {
                                    await updateStatus(rejectingSub, "rejected", rejectionReason);
                                    setRejectingSub(null);
                                }}
                                className="px-6 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all flex items-center gap-2"
                            >
                                {updating === rejectingSub.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm Rejection"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
