"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Home } from "lucide-react";
import { Suspense } from "react";

function SuccessContent() {
    const searchParams = useSearchParams();
    const ref = searchParams.get('ref') || "DTW-XXXXXX";

    return (
        <div className="bg-white rounded-3xl shadow-xl p-10 md:p-14 text-center max-w-xl mx-auto border border-navy/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-[40px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-navy/5 rounded-full blur-[40px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
                <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
                <h1 className="text-3xl md:text-4xl font-heading font-bold text-navy mb-4">
                    Submission Successful
                </h1>
                <p className="text-lg text-black/60 font-medium mb-8">
                    Thank you for your purchase. Your payment proof has been securely uploaded and is now in our review queue.
                </p>

                <div className="bg-offwhite border border-black/10 rounded-2xl p-6 w-full mb-8">
                    <p className="text-sm text-black/50 font-medium mb-2 uppercase tracking-wide">Your Reference Code</p>
                    <div className="text-2xl font-mono font-bold tracking-widest text-navy">
                        {ref}
                    </div>
                </div>

                <div className="bg-navy/5 p-6 rounded-2xl w-full text-left mb-8">
                    <h3 className="font-bold text-navy mb-3">What happens next?</h3>
                    <ul className="space-y-3">
                        <li className="flex gap-3 text-sm text-black/70 font-medium">
                            <span className="w-6 h-6 rounded-full bg-gold/20 text-navy flex items-center justify-center shrink-0">1</span>
                            Our admin team will verify your screenshot within 24 hours.
                        </li>
                        <li className="flex gap-3 text-sm text-black/70 font-medium">
                            <span className="w-6 h-6 rounded-full bg-gold/20 text-navy flex items-center justify-center shrink-0">2</span>
                            You will receive an email letting you know your license is approved.
                        </li>
                        <li className="flex gap-3 text-sm text-black/70 font-medium">
                            <span className="w-6 h-6 rounded-full bg-gold/20 text-navy flex items-center justify-center shrink-0">3</span>
                            Click the link in the email to set your password and start reading!
                        </li>
                    </ul>
                </div>

                <Link href="/" className="inline-flex items-center gap-2 text-navy font-bold hover:text-gold transition-colors">
                    <Home className="w-4 h-4" /> Return to Home
                </Link>
            </div>
        </div>
    );
}

export default function BuySuccessPage() {
    return (
        <div className="min-h-screen bg-offwhite py-32 flex items-center justify-center px-6">
            <Suspense fallback={<div className="text-center font-bold text-navy animate-pulse">Loading Receipt...</div>}>
                <SuccessContent />
            </Suspense>
        </div>
    );
}
