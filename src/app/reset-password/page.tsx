"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { Loader2, Lock, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

const resetSchema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type ResetData = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isVerifying, setIsVerifying] = useState(true);

    useEffect(() => {
        // We check if we have a session (the reset link auto-logs you in temporarily)
        const checkSession = async () => {
            // 1. Check if there's a PKCE code in the URL
            const params = new URLSearchParams(window.location.search);
            const code = params.get("code");

            if (code) {
                const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                if (exchangeError) {
                    setError("Link expired or invalid. Please try requesting a new one.");
                    setIsVerifying(false);
                    return;
                }
            }

            // 2. Now check if we have a valid session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError("Your password reset link is invalid or has expired. Please request a new one.");
            }
            setIsVerifying(false);
        };
        checkSession();
    }, []);

    const { register, handleSubmit, formState: { errors } } = useForm<ResetData>({
        resolver: zodResolver(resetSchema),
    });

    const onSubmit = async (data: ResetData) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: data.password
            });

            if (error) throw error;

            setSuccess(true);
            // Auto logout to make sure they log in with new password
            await supabase.auth.signOut();

            setTimeout(() => {
                router.push("/login");
            }, 3000);

        } catch (err) {
            if (err instanceof Error) {
                setError(err.message || "Failed to update password.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isVerifying) {
        return (
            <div className="min-h-screen bg-navy flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-navy flex items-center justify-center p-6 relative overflow-hidden">
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md bg-white rounded-3xl p-8 md:p-12 shadow-2xl relative z-10">
                {!success ? (
                    <>
                        <div className="text-center mb-10">
                            <div className="w-16 h-16 rounded-full border-4 border-gold/30 bg-gold/10 flex items-center justify-center text-gold font-heading font-bold mx-auto mb-6">
                                <Lock className="w-7 h-7" />
                            </div>
                            <h1 className="text-3xl font-heading font-bold text-navy mb-2">Reset Password</h1>
                            <p className="text-black/60 font-medium">Create a strong new password to protect your account.</p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-200 flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p>{error}</p>
                                        {!isSubmitting && error.includes("expired") && (
                                            <Link href="/forgot-password" className="text-navy underline mt-2 block italic text-xs">Request new link →</Link>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-navy">New Password</label>
                                <div className="relative">
                                    <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
                                    <input
                                        {...register("password")}
                                        type="password"
                                        className="w-full pl-12 pr-4 py-3.5 bg-offwhite border border-black/10 rounded-xl focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all"
                                        placeholder="Min 6 characters"
                                    />
                                </div>
                                {errors.password && <p className="text-red-500 text-xs font-medium">{errors.password.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-navy">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
                                    <input
                                        {...register("confirmPassword")}
                                        type="password"
                                        className="w-full pl-12 pr-4 py-3.5 bg-offwhite border border-black/10 rounded-xl focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                                {errors.confirmPassword && <p className="text-red-500 text-xs font-medium">{errors.confirmPassword.message}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || error !== null && !error.includes("failed")}
                                className="w-full bg-navy hover:bg-navy/90 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update Password"}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                            <CheckCircle className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-heading font-bold text-navy mb-4">Password Reset!</h2>
                        <p className="text-black/60 font-medium mb-8 leading-relaxed">
                            Your password has been successfully updated. You will be redirected to the login page shortly.
                        </p>
                        <Link
                            href="/login"
                            className="inline-block w-full bg-navy hover:bg-navy/90 text-white font-bold py-4 rounded-xl shadow-lg transition-all text-center"
                        >
                            Log In Now
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
