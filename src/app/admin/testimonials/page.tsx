"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Edit2, Loader2, Upload, Star } from "lucide-react";

type Testimonial = {
    id: string;
    name: string;
    location: string;
    role: string;
    rating: number;
    quote: string;
    quote_np: string | null;
    image_path: string | null;
    is_active: boolean;
};

export default function AdminTestimonialsPage() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<Testimonial | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Form state
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<Partial<Testimonial>>({});
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);

    const fetchTestimonials = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("testimonials")
            .select("*")
            .order("created_at", { ascending: false });

        if (data) setTestimonials(data);
        if (error) {
            console.error("Error fetching testimonials:", error);
            if (error.code === 'PGRST205') {
                setSaveError("The testimonials table does not exist. Please run the SQL migration in the Supabase Dashboard.");
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTestimonials();
    }, []);

    const openEdit = (t: Testimonial) => {
        setIsEditing(t);
        setFormData({ ...t });
        setImageFile(null);
        setIsCreating(false);
        setSaveError(null);
    };

    const openCreate = () => {
        setIsCreating(true);
        setIsEditing(null);
        setFormData({ rating: 5, is_active: true });
        setImageFile(null);
        setSaveError(null);
    };

    const closeForm = () => {
        setIsEditing(null);
        setIsCreating(false);
    };

    const handleDelete = async (id: string, imagePath: string | null) => {
        if (!confirm("Are you sure you want to delete this testimonial?")) return;

        // delete image if exists
        if (imagePath) {
            await supabase.storage.from("assets").remove([imagePath]);
        }

        const { error } = await supabase.from("testimonials").delete().eq("id", id);
        if (error) {
            alert("Error deleting testimonial");
        } else {
            fetchTestimonials();
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSaveError(null);

        try {
            let imagePath = formData.image_path;

            // Upload new image if provided
            if (imageFile) {
                const ext = imageFile.name.split(".").pop();
                const path = `testimonials/user-${Date.now()}.${ext}`;
                const { error: uploadErr } = await supabase.storage
                    .from("assets")
                    .upload(path, imageFile, { upsert: true });

                if (uploadErr) {
                    throw new Error(`Upload failed: ${uploadErr.message}`);
                }

                // If editing and had previous image, maybe try deleting the old one
                if (isEditing && isEditing.image_path) {
                    await supabase.storage.from("assets").remove([isEditing.image_path]);
                }

                imagePath = path;
            }

            const payload = {
                ...formData,
                image_path: imagePath,
            };

            if (isCreating) {
                const { error } = await supabase.from("testimonials").insert(payload);
                if (error) throw error;
            } else if (isEditing) {
                const { error } = await supabase
                    .from("testimonials")
                    .update(payload)
                    .eq("id", isEditing.id);
                if (error) throw error;
            }

            closeForm();
            fetchTestimonials();
        } catch (err: any) {
            setSaveError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>;

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-2xl font-heading font-bold text-navy">Testimonials</h1>
                    <p className="text-black/50 font-medium mt-1">Manage success stories and readers&apos; feedback</p>
                </div>
                {!isCreating && !isEditing && (
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 bg-navy hover:bg-navy/90 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md"
                    >
                        <Plus className="w-4 h-4" /> Add Testimonial
                    </button>
                )}
            </div>

            {saveError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                    ⚠️ {saveError}
                </div>
            )}

            {(isCreating || isEditing) ? (
                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 md:p-8">
                    <h2 className="text-xl font-heading font-bold text-navy mb-6">
                        {isCreating ? "Add New Testimonial" : "Edit Testimonial"}
                    </h2>
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-navy">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name || ""}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-offwhite border border-black/10 rounded-xl text-sm focus:border-gold outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-navy">Location</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.location || ""}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full px-4 py-3 bg-offwhite border border-black/10 rounded-xl text-sm focus:border-gold outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-navy">Role / Profession</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.role || ""}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-4 py-3 bg-offwhite border border-black/10 rounded-xl text-sm focus:border-gold outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-navy">Rating (1-5)</label>
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={formData.rating || 5}
                                    onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 bg-offwhite border border-black/10 rounded-xl text-sm focus:border-gold outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-navy">Quote (English)</label>
                            <textarea
                                required
                                rows={3}
                                value={formData.quote || ""}
                                onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                                className="w-full px-4 py-3 bg-offwhite border border-black/10 rounded-xl text-sm focus:border-gold outline-none resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-navy">Quote (Nepali) - Optional</label>
                            <textarea
                                rows={2}
                                value={formData.quote_np || ""}
                                onChange={(e) => setFormData({ ...formData, quote_np: e.target.value })}
                                className="w-full px-4 py-3 bg-offwhite border border-black/10 rounded-xl text-sm focus:border-gold outline-none resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-navy block">User Photo</label>
                            {(imageFile || formData.image_path) && (
                                <div className="mt-2 mb-4 p-2 border border-black/10 rounded-xl bg-offwhite inline-block">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={imageFile ? URL.createObjectURL(imageFile) : supabase.storage.from("assets").getPublicUrl(formData.image_path!).data.publicUrl}
                                        alt="User Preview"
                                        className="h-24 w-24 object-cover rounded-full mx-auto"
                                    />
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 font-bold text-sm bg-offwhite border border-black/10 px-4 py-2.5 rounded-xl cursor-pointer hover:border-gold transition-colors">
                                    <Upload className="w-4 h-4 text-gold" />
                                    {imageFile ? imageFile.name : formData.image_path ? "Change Photo" : "Upload Photo"}
                                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                                </label>
                                {formData.image_path && !imageFile && (
                                    <button type="button" onClick={() => setFormData({ ...formData, image_path: null })} className="text-sm text-red-500 font-bold hover:underline">
                                        Remove image
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-4 border-t border-black/5">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={formData.is_active || false}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="w-4 h-4 accent-gold cursor-pointer"
                            />
                            <label htmlFor="is_active" className="text-sm font-bold text-navy cursor-pointer">
                                Active (Show on Website)
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 pt-6">
                            <button
                                type="button"
                                onClick={closeForm}
                                className="px-6 py-3 rounded-xl font-bold text-black/60 hover:bg-black/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 bg-navy hover:bg-navy/90 text-white font-bold px-8 py-3 rounded-xl transition-all disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                {saving ? "Saving..." : "Save Testimonial"}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-6">
                    {testimonials.map((t) => (
                        <div key={t.id} className={`bg-white rounded-2xl p-6 border shadow-sm transition-all ${t.is_active ? "border-black/5 hover:shadow-md" : "border-red-100 opacity-70"}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex gap-4 items-center">
                                    <div className="w-12 h-12 shrink-0 rounded-full bg-offwhite overflow-hidden border border-black/5 flex items-center justify-center font-heading font-bold text-navy text-xl">
                                        {t.image_path ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={supabase.storage.from("assets").getPublicUrl(t.image_path).data.publicUrl} alt={t.name} className="w-full h-full object-cover" />
                                        ) : (
                                            t.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-navy flex items-center gap-2">
                                            {t.name}
                                            {!t.is_active && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Hidden</span>}
                                        </h3>
                                        <p className="text-xs text-black/50">{t.role} • {t.location}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openEdit(t)} className="p-2 text-black/40 hover:text-navy hover:bg-black/5 rounded-lg transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(t.id, t.image_path)} className="p-2 text-black/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-1 mb-2">
                                {Array(t.rating).fill(null).map((_, i) => (
                                    <Star key={i} className="w-3.5 h-3.5 fill-gold text-gold" />
                                ))}
                            </div>
                            <p className="text-sm text-black/70 mb-2 line-clamp-3">"{t.quote}"</p>
                            {t.quote_np && <p className="text-xs text-black/40 font-nepali italic line-clamp-2">"{t.quote_np}"</p>}
                        </div>
                    ))}
                    {testimonials.length === 0 && !loading && !saveError && (
                        <div className="col-span-full text-center py-12 text-black/40 font-medium bg-white rounded-2xl border border-dashed border-black/10">
                            No testimonials found. Create one to get started.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
