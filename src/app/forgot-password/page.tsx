"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

const forgotSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
});

type ForgotData = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<ForgotData>({
        resolver: zodResolver(forgotSchema),
    });

    const onSubmit = async (data: ForgotData) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            setSuccess(true);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message || "Something went wrong.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-navy flex items-center justify-center p-6 relative overflow-hidden">
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md bg-white rounded-3xl p-8 md:p-12 shadow-2xl relative z-10">
                {!success ? (
                    <>
                        <div className="mb-8">
                            <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-black/40 hover:text-navy transition-colors">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Login
                            </Link>
                        </div>

                        <div className="text-center mb-10">
                            <div className="w-16 h-16 rounded-full border-4 border-gold/30 bg-gold/10 flex items-center justify-center text-gold font-heading font-bold text-2xl mx-auto mb-6">
                                <Lock className="w-7 h-7" />
                            </div>
                            <h1 className="text-3xl font-heading font-bold text-navy mb-2">Forgot Password?</h1>
                            <p className="text-black/60 font-medium">Enter your email and we'll send you a link to reset your password.</p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-200">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-navy">Email Address</label>
                                <div className="relative">
                                    <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
                                    <input
                                        {...register("email")}
                                        type="email"
                                        className="w-full pl-12 pr-4 py-3.5 bg-offwhite border border-black/10 rounded-xl focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all"
                                        placeholder="your@email.com"
                                    />
                                </div>
                                {errors.email && <p className="text-red-500 text-xs font-medium">{errors.email.message}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-navy hover:bg-navy/90 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Link"}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                            <CheckCircle className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-heading font-bold text-navy mb-4">Check Your Email</h2>
                        <p className="text-black/60 font-medium mb-8 leading-relaxed">
                            We've sent a password reset link to your email address. Please check your inbox (and spam folder) to continue.
                        </p>
                        <Link
                            href="/login"
                            className="inline-block w-full bg-navy hover:bg-navy/90 text-white font-bold py-4 rounded-xl shadow-lg transition-all text-center"
                        >
                            Return to Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

import { Lock } from "lucide-react";
