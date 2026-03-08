"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { QrCode, UploadCloud, Loader2, Tag, CheckCircle, XCircle } from "lucide-react";

// Form Schema Validation
const purchaseSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().min(8, "Please enter a valid phone number"),
    message: z.string().optional(),
    screenshot: z.custom<FileList>()
        .refine((files) => files?.length === 1, "Payment screenshot is required")
        .refine(
            (files) => files && files[0]?.size <= 5 * 1024 * 1024,
            "Max file size is 5MB"
        )
        .refine(
            (files) => files && ["image/jpeg", "image/png", "image/webp"].includes(files[0]?.type),
            "Only .jpg, .png and .webp formats are supported"
        ),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

export default function BuyPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [qrUrl, setQrUrl] = useState<string | null>(null);
    const [originalPrice, setOriginalPrice] = useState<number>(499);
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_value: number; discount_type: string } | null>(null);
    const [couponError, setCouponError] = useState<string | null>(null);
    const [verifyingCoupon, setVerifyingCoupon] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase
                .from("settings")
                .select("qr_code_path, book_price")
                .eq("id", 1)
                .single();
            if (data?.qr_code_path) {
                const { data: urlData } = supabase.storage
                    .from("assets")
                    .getPublicUrl(data.qr_code_path);
                setQrUrl(urlData.publicUrl);
            }
            if (data?.book_price) setOriginalPrice(data.book_price);
        };
        fetchSettings();
    }, []);

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<PurchaseFormData>({
        resolver: zodResolver(purchaseSchema),
    });

    const screenshotFiles = watch("screenshot");

    useEffect(() => {
        if (screenshotFiles && screenshotFiles.length > 0) {
            const file = screenshotFiles[0];
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [screenshotFiles]);

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setVerifyingCoupon(true);
        setCouponError(null);

        try {
            const { data, error } = await supabase
                .from("coupons")
                .select("code, discount_value, discount_type")
                .ilike("code", couponCode.trim())
                .eq("is_active", true)
                .single();

            if (error || !data) {
                setCouponError("Invalid or expired coupon code");
                setAppliedCoupon(null);
            } else {
                setAppliedCoupon(data);
                setCouponError(null);
            }
        } catch (err) {
            setCouponError("Failed to verify coupon");
        } finally {
            setVerifyingCoupon(false);
        }
    };

    const calculateFinalPrice = () => {
        if (!appliedCoupon) return originalPrice;
        if (appliedCoupon.discount_type === "percent") {
            return Math.max(0, originalPrice - (originalPrice * appliedCoupon.discount_value) / 100);
        }
        return Math.max(0, originalPrice - appliedCoupon.discount_value);
    };

    const finalPrice = Math.round(calculateFinalPrice() * 100) / 100;

    const onSubmit = async (data: PurchaseFormData) => {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const file = data.screenshot[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `receipts/${fileName}`;

            // 1. Upload Screenshot to Private Bucket
            const { error: uploadError } = await supabase.storage
                .from('screenshots')
                .upload(filePath, file);

            if (uploadError) throw new Error("Failed to upload screenshot. Please try again.");

            // 2. Insert Submission Record
            const referenceNumber = `DTW-${Math.floor(100000 + Math.random() * 900000)}`;

            const { error: dbError, data: dbData } = await supabase
                .from('submissions')
                .insert({
                    name: data.fullName,
                    email: data.email,
                    phone: data.phone,
                    message: data.message || null,
                    screenshot_path: filePath,
                    reference_number: referenceNumber,
                    status: 'pending',
                    coupon_used: appliedCoupon?.code || null,
                    final_amount: finalPrice
                });

            console.log('[DB INSERT] error:', JSON.stringify(dbError));
            console.log('[DB INSERT] data:', JSON.stringify(dbData));

            if (dbError) throw new Error(`DB Error: ${dbError.code} — ${dbError.message} — ${dbError.details}`);

            // 3. Send confirmation emails (fire and forget)
            fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'submission',
                    name: data.fullName,
                    email: data.email,
                    referenceNumber,
                }),
            }).then(async (res) => {
                const json = await res.json();
                console.log('[Email API response]', res.status, json);
            }).catch((err) => {
                console.error('[Email API fetch error]', err);
            });

            // 4. Redirect to Success Page
            router.push(`/buy/success?ref=${referenceNumber}`);


        } catch (err) {
            if (err instanceof Error) {
                setSubmitError(err.message); // Shows the full DB error code + message
            } else {
                setSubmitError("An unexpected error occurred.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-offwhite py-32">
            <div className="container mx-auto px-6 max-w-5xl">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-heading font-bold text-navy mb-4">
                        Secure Your Access
                    </h1>
                    <p className="text-lg text-black/60 font-medium">
                        Complete the payment via QR and submit your details to get instant lifetime access.
                    </p>
                </div>

                <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-navy/5">
                    {/* Layout Left: Payment Details */}
                    <div className="md:w-5/12 bg-navy p-10 text-white flex flex-col justify-between">
                        <div>
                            <div className="inline-block px-4 py-1.5 rounded-full border border-gold/30 bg-gold/10 text-gold-light text-sm font-semibold mb-6">
                                Step 1: Make Payment
                            </div>
                            <h2 className="text-2xl font-heading font-bold mb-6">Payment Details</h2>

                            <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/10 text-center flex flex-col items-center">
                                <QrCode className="w-16 h-16 text-gold mb-4" />
                                <div className="w-48 h-48 bg-white rounded-xl mb-4 overflow-hidden flex items-center justify-center shadow-inner">
                                    {qrUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={qrUrl} alt="Payment QR Code" className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="text-navy/40 text-sm font-medium text-center px-4">QR Code<br />(Coming Soon)</span>
                                    )}
                                </div>
                                <p className="text-white/80 text-sm font-medium">
                                    Scan using eSewa, Khalti, or Mobile Banking
                                </p>
                            </div>

                            <div className="space-y-4 font-medium">
                                <div className="flex justify-between border-b border-white/10 pb-4">
                                    <span className="text-white/60">Total Amount</span>
                                    <div className="text-right">
                                        {appliedCoupon && (
                                            <span className="text-white/40 line-through text-sm mr-2">NPR {originalPrice}</span>
                                        )}
                                        <span className="text-gold font-bold text-xl">NPR {finalPrice}</span>
                                    </div>
                                </div>

                                {/* Coupon Input */}
                                <div className="pt-2">
                                    <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 block">Have a Coupon?</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                            <input
                                                type="text"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                placeholder="Enter code"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm focus:border-gold outline-none transition-all"
                                                disabled={!!appliedCoupon}
                                            />
                                        </div>
                                        {appliedCoupon ? (
                                            <button
                                                onClick={() => { setAppliedCoupon(null); setCouponCode(""); }}
                                                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
                                            >
                                                Remove
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleApplyCoupon}
                                                disabled={verifyingCoupon || !couponCode}
                                                className="bg-gold hover:bg-gold-light text-navy px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                            >
                                                {verifyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                                            </button>
                                        )}
                                    </div>
                                    {couponError && <p className="text-red-400 text-[10px] mt-1.5 font-bold flex items-center gap-1 uppercase tracking-wider"><XCircle className="w-3 h-3" /> {couponError}</p>}
                                    {appliedCoupon && <p className="text-green-400 text-[10px] mt-1.5 font-bold flex items-center gap-1 uppercase tracking-wider"><CheckCircle className="w-3 h-3" /> Coupon Applied: {appliedCoupon.discount_type === 'percent' ? `${appliedCoupon.discount_value}% OFF` : `NPR ${appliedCoupon.discount_value} OFF`}</p>}
                                </div>
                                <div className="flex justify-between border-b border-white/10 pb-4">
                                    <span className="text-white/60">Includes</span>
                                    <span className="text-right">Lifetime Access &<br />21-Day Challenge</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Layout Right: Submission Form */}
                    <div className="md:w-7/12 p-10 lg:p-14">
                        <div className="inline-block px-4 py-1.5 rounded-full border border-navy/10 bg-offwhite text-navy text-sm font-semibold mb-6">
                            Step 2: Submit Proof
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                            {submitError && (
                                <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
                                    {submitError}
                                </div>
                            )}

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-navy">Full Name <span className="text-red-500">*</span></label>
                                    <input
                                        {...register("fullName")}
                                        type="text"
                                        className="w-full px-4 py-3 bg-offwhite border border-black/10 rounded-xl focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all"
                                        placeholder="Enter your name"
                                    />
                                    {errors.fullName && <p className="text-red-500 text-xs font-medium">{errors.fullName.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-navy">Phone Number <span className="text-red-500">*</span></label>
                                    <input
                                        {...register("phone")}
                                        type="tel"
                                        className="w-full px-4 py-3 bg-offwhite border border-black/10 rounded-xl focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all"
                                        placeholder="e.g. 98XXXXXXXX"
                                    />
                                    {errors.phone && <p className="text-red-500 text-xs font-medium">{errors.phone.message}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-navy">Email Address <span className="text-red-500">*</span></label>
                                <input
                                    {...register("email")}
                                    type="email"
                                    className="w-full px-4 py-3 bg-offwhite border border-black/10 rounded-xl focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all"
                                    placeholder="Where should we send the license link?"
                                />
                                <p className="text-xs text-black/50 font-medium">Please ensure this is correct, your reading account will securely link to this email.</p>
                                {errors.email && <p className="text-red-500 text-xs font-medium">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="text-sm font-bold text-navy">Upload Payment Screenshot <span className="text-red-500">*</span></label>
                                <div className="w-full border-2 border-dashed border-black/10 hover:border-gold rounded-2xl transition-colors bg-offwhite text-center cursor-pointer relative min-h-[160px] flex items-center justify-center overflow-hidden">
                                    {!previewUrl ? (
                                        <div className="p-6 w-full h-full flex flex-col items-center justify-center">
                                            <input
                                                {...register("screenshot")}
                                                type="file"
                                                accept="image/png, image/jpeg, image/webp"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <UploadCloud className="w-8 h-8 text-navy/40 mx-auto mb-2" />
                                            <span className="text-sm font-medium text-navy/70">Click to upload or drag & drop</span>
                                            <p className="text-xs text-navy/40 mt-1">JPEG, PNG or WEBP (Max 5MB)</p>
                                        </div>
                                    ) : (
                                        <div className="relative w-full p-2 group">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={previewUrl}
                                                alt="Payment Preview"
                                                className="max-h-[300px] w-auto mx-auto rounded-xl shadow-md border border-navy/5"
                                            />
                                            <div className="absolute inset-0 bg-navy/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl m-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setPreviewUrl(null);
                                                        setValue("screenshot", [] as unknown as FileList);
                                                    }}
                                                    className="bg-white text-navy px-4 py-2 rounded-lg font-bold text-xs"
                                                >
                                                    Remove and change
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {errors.screenshot && <p className="text-red-500 text-xs font-medium">{errors.screenshot.message as string}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-navy">Message (Optional)</label>
                                <textarea
                                    {...register("message")}
                                    className="w-full px-4 py-3 bg-offwhite border border-black/10 rounded-xl focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all min-h-[100px] resize-y"
                                    placeholder="Any questions or notes?"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-navy hover:bg-navy/90 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Securely Uploading...
                                    </>
                                ) : (
                                    "Submit Payment Proof"
                                )}
                            </button>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
