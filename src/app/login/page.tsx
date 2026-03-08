"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { Loader2, Mail, Lock } from "lucide-react";
import Link from "next/link";

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginData = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginData) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (error) throw error;

            // Successfully authenticated! Go to reader.
            router.push("/read");
            router.refresh();

        } catch (err) {
            if (err instanceof Error) {
                setError(err.message || "Invalid credentials.");
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
                <div className="text-center mb-10">
                    <div className="w-16 h-16 rounded-full border-4 border-gold/30 bg-gold/10 flex items-center justify-center text-gold font-heading font-bold text-2xl mx-auto mb-6">
                        W
                    </div>
                    <h1 className="text-3xl font-heading font-bold text-navy mb-2">Welcome Back</h1>
                    <p className="text-black/60 font-medium">Log in to access your digital copy.</p>
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

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-sm font-bold text-navy">Password</label>
                            <Link href="/forgot-password" className="text-sm font-medium text-gold hover:text-gold-light transition-colors">
                                Forgot password?
                            </Link>
                        </div>
                        <div className="relative">
                            <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
                            <input
                                {...register("password")}
                                type="password"
                                className="w-full pl-12 pr-4 py-3.5 bg-offwhite border border-black/10 rounded-xl focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                        {errors.password && <p className="text-red-500 text-xs font-medium">{errors.password.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-navy hover:bg-navy/90 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Read Now"}
                    </button>
                </form>

                <div className="mt-8 pt-8 border-t border-black/5 text-center text-sm font-medium text-black/60">
                    Don't have a license yet? <Link href="/buy" className="text-gold font-bold hover:underline">Buy the Book</Link>
                </div>
            </div>
        </div>
    );
}
