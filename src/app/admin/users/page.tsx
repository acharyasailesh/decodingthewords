"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Search, CheckCircle, XCircle, Clock, UserPlus, Trash2 } from "lucide-react";

type RegisteredUser = {
    kind: "user";
    id: string;
    email: string;
    full_name: string;
    has_license: boolean;
    license_granted_at: string | null;
    created_at: string;
};

type PendingSubmission = {
    kind: "submission";
    id: string;
    email: string;
    name: string;
    reference_number: string;
    final_amount: number | null;
    submitted_at: string;
};

type Entry = RegisteredUser | PendingSubmission;
type Filter = "all" | "pending" | "licensed" | "no_license";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<RegisteredUser[]>([]);
    const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<Filter>("all");
    const [updating, setUpdating] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [rejectingSub, setRejectingSub] = useState<PendingSubmission | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3500);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [usersRes, subsRes] = await Promise.all([
            supabase
                .from("users")
                .select("id, email, full_name, has_license, license_granted_at, created_at")
                .order("created_at", { ascending: false }),
            supabase
                .from("submissions")
                .select("id, email, name, reference_number, final_amount, submitted_at")
                .eq("status", "pending")
                .order("submitted_at", { ascending: false }),
        ]);

        if (usersRes.data) setUsers(usersRes.data.map(u => ({ ...u, kind: "user" as const })));
        if (subsRes.data) setPendingSubmissions(subsRes.data.map(s => ({ ...s, kind: "submission" as const, submitted_at: s.submitted_at || new Date().toISOString() })));

        const { data: { user } } = await supabase.auth.getUser();
        if (user) setCurrentAdminId(user.id);

        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Toggle license for registered users
    const toggleLicense = async (id: string, current: boolean, email: string, fullName: string) => {
        setUpdating(id);
        await supabase
            .from("users")
            .update({
                has_license: !current,
                license_granted_at: !current ? new Date().toISOString() : null,
            })
            .eq("id", id);

        setUsers(prev => prev.map(u =>
            u.id === id ? { ...u, has_license: !current, license_granted_at: !current ? new Date().toISOString() : null } : u
        ));

        if (!current && email) {
            fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'license_approved', email, fullName: fullName || email, name: fullName || email }),
            }).catch(() => { });
        }
        showToast(!current ? `✅ License granted to ${fullName || email}` : `❌ License revoked for ${email}`);
        setUpdating(null);
    };

    // Approve a pending submission — creates their account + pre-grants license
    const approveSubmission = async (sub: PendingSubmission) => {
        setUpdating(sub.id);
        try {
            const res = await fetch('/api/admin/invite-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: sub.email, name: sub.name, submissionId: sub.id }),
            });
            const result = await res.json();

            if (result.success) {
                setPendingSubmissions(prev => prev.filter(s => s.id !== sub.id));
                // Refresh users list
                const { data } = await supabase
                    .from("users")
                    .select("id, email, full_name, has_license, license_granted_at, created_at")
                    .order("created_at", { ascending: false });
                if (data) setUsers(data.map(u => ({ ...u, kind: "user" as const })));
                showToast(`✅ ${sub.name} approved! Invite email sent to ${sub.email}`);
            } else {
                showToast(`❌ Error: ${result.error}`);
            }
        } catch (e) {
            showToast(`❌ Network error: ${String(e)}`);
        } finally {
            setUpdating(null);
        }
    };

    // Reject a pending submission
    const rejectSubmission = async (sub: PendingSubmission, reason: string) => {
        setUpdating(sub.id);
        try {
            const { error } = await supabase
                .from("submissions")
                .update({
                    status: 'rejected',
                    reviewed_at: new Date().toISOString(),
                    rejection_reason: reason || null
                })
                .eq("id", sub.id);

            if (!error) {
                setPendingSubmissions(prev => prev.filter(s => s.id !== sub.id));

                // Send rejection email
                await fetch('/api/send-email', {
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

                showToast(`✅ Submission rejected and user notified`);
            } else {
                showToast(`❌ DB Error: ${error.message}`);
            }
        } catch (e) {
            showToast(`❌ Error: ${String(e)}`);
        } finally {
            setUpdating(null);
        }
    };

    // Delete an entry (user or submission)
    const deleteEntry = async (entry: Entry) => {
        if (!confirm(`Are you absolutely sure you want to delete ${entry.kind === "user" ? entry.full_name || entry.email : entry.name}? This action cannot be undone.`)) {
            return;
        }

        setUpdating(entry.id);
        try {
            const res = await fetch('/api/admin/delete-entry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: entry.id, type: entry.kind }),
            });
            const result = await res.json();

            if (result.success) {
                if (entry.kind === "user") {
                    setUsers(prev => prev.filter(u => u.id !== entry.id));
                } else {
                    setPendingSubmissions(prev => prev.filter(s => s.id !== entry.id));
                }
                showToast(`✅ Successfully deleted ${entry.email}`);
            } else {
                showToast(`❌ Error: ${result.error}`);
            }
        } catch (e) {
            showToast(`❌ Network error: ${String(e)}`);
        } finally {
            setUpdating(null);
        }
    };

    // Combine and sort all entries by their timestamp
    const allEntries: Entry[] = [
        ...users.filter(u => u.id !== currentAdminId), // Hide current admin
        ...pendingSubmissions,
    ].sort((a, b) => {
        const aTime = a.kind === "user" ? a.created_at : a.submitted_at;
        const bTime = b.kind === "user" ? b.created_at : b.submitted_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    const filtered = allEntries.filter((e) => {
        const name = e.kind === "user" ? e.full_name : e.name;
        const matchSearch =
            search === "" ||
            (name || "").toLowerCase().includes(search.toLowerCase()) ||
            e.email.toLowerCase().includes(search.toLowerCase());

        const matchFilter =
            filter === "all" ||
            (filter === "pending" && e.kind === "submission") ||
            (filter === "licensed" && e.kind === "user" && e.has_license) ||
            (filter === "no_license" && e.kind === "user" && !e.has_license);

        return matchSearch && matchFilter;
    });

    const counts = {
        all: allEntries.length,
        pending: pendingSubmissions.length,
        licensed: users.filter(u => u.has_license).length,
        no_license: users.filter(u => !u.has_license).length,
    };

    const tabs: { key: Filter; label: string }[] = [
        { key: "all", label: "All" },
        { key: "pending", label: "⏳ Pending Approval" },
        { key: "licensed", label: "Licensed" },
        { key: "no_license", label: "No License" },
    ];

    return (
        <div className="p-8 relative">

            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-6 right-6 z-50 bg-navy text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl animate-fade-in">
                    {toast}
                </div>
            )}

            <div className="mb-6">
                <h1 className="text-2xl font-heading font-bold text-navy">Users & Licenses</h1>
                <p className="text-black/50 font-medium mt-1">
                    Approve submissions, grant or revoke reading licenses.
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex gap-2 flex-wrap">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === tab.key
                                ? "bg-navy text-white shadow-md"
                                : "bg-white text-black/50 border border-black/10 hover:border-navy"
                                }`}
                        >
                            {tab.label} ({counts[tab.key]})
                        </button>
                    ))}
                </div>
                <div className="relative ml-auto w-full md:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
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
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#F4F5F9] border-b border-black/5 text-xs uppercase tracking-wider text-black/40">
                                <th className="p-4 font-bold">User</th>
                                <th className="p-4 font-bold">Date</th>
                                <th className="p-4 font-bold">Status</th>
                                <th className="p-4 font-bold text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {filtered.map((entry) => (
                                <tr key={`${entry.kind}-${entry.id}`} className="hover:bg-[#F4F5F9]/50 transition-colors">
                                    <td className="p-4">
                                        {entry.kind === "user" ? (
                                            <>
                                                <p className="font-bold text-navy text-sm">{entry.full_name || "—"}</p>
                                                <p className="text-xs text-black/50">{entry.email}</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="font-bold text-navy text-sm">{entry.name}</p>
                                                <p className="text-xs text-black/50">{entry.email}</p>
                                                <span className="text-[10px] font-mono text-gold/80 font-bold">{entry.reference_number}</span>
                                            </>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm text-black/60">
                                        {new Date(entry.kind === "user" ? entry.created_at : entry.submitted_at).toLocaleDateString("en-NP")}
                                    </td>
                                    <td className="p-4">
                                        {entry.kind === "submission" ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                                                <Clock className="w-3 h-3" /> Pending Approval
                                            </span>
                                        ) : entry.has_license ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                                <CheckCircle className="w-3 h-3" /> Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
                                                <Clock className="w-3 h-3" /> No License
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {entry.kind === "submission" ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        disabled={updating === entry.id}
                                                        onClick={() => approveSubmission(entry)}
                                                        className="inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 disabled:opacity-50 min-w-[140px]"
                                                    >
                                                        {updating === entry.id
                                                            ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                                                            : <><UserPlus className="w-3.5 h-3.5" /> Approve & Invite</>
                                                        }
                                                    </button>
                                                    <button
                                                        disabled={updating === entry.id}
                                                        onClick={() => {
                                                            setRejectingSub(entry);
                                                            setRejectionReason("");
                                                        }}
                                                        className="inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 disabled:opacity-50"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" /> Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    disabled={updating === entry.id}
                                                    onClick={() => toggleLicense(entry.id, entry.has_license, entry.email, entry.full_name)}
                                                    className={`inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 min-w-[140px] ${entry.has_license
                                                        ? "text-red-600 bg-red-50 hover:bg-red-100 border border-red-100"
                                                        : "text-green-700 bg-green-50 hover:bg-green-100 border border-green-100"
                                                        }`}
                                                >
                                                    {updating === entry.id ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                                                    ) : entry.has_license ? (
                                                        <><XCircle className="w-3.5 h-3.5" /> Revoke License</>
                                                    ) : (
                                                        <><CheckCircle className="w-3.5 h-3.5" /> Grant License</>
                                                    )}
                                                </button>
                                            )}

                                            <button
                                                disabled={updating === entry.id}
                                                onClick={() => deleteEntry(entry)}
                                                title="Delete permanently"
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors text-black/40 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 disabled:opacity-50"
                                            >
                                                {updating === entry.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-10 text-center text-sm text-black/40">
                                        {allEntries.length === 0 && search === "" ? (
                                            "No users or submissions yet."
                                        ) : filtered.length === 0 ? (
                                            <div className="flex flex-col items-center gap-1">
                                                <p>No matches found in this view.</p>
                                                <p className="text-[10px] italic">(Current administrators are hidden from this list)</p>
                                            </div>
                                        ) : "No entries found."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

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
                        <div className="bg-[#F8F9FA] p-4 flex gap-3 justify-end">
                            <button
                                onClick={() => setRejectingSub(null)}
                                className="px-5 py-2 text-xs font-bold text-black/50 hover:text-navy transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={updating === rejectingSub.id}
                                onClick={async () => {
                                    await rejectSubmission(rejectingSub, rejectionReason);
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
