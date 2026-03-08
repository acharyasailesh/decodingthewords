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

                <div className="bg-navy/5 p-6 rounded-2xl w-full text-left mb-10">
                    <h3 className="font-bold text-navy mb-3">What happens next?</h3>
                    <ul className="space-y-3 mb-6">
                        <li className="flex gap-3 text-sm text-black/70 font-medium">
                            <span className="w-6 h-6 rounded-full bg-gold/20 text-navy flex items-center justify-center shrink-0">1</span>
                            Our admin team will verify your screenshot within 24 hours.
                        </li>
                        <li className="flex gap-3 text-sm text-black/70 font-medium">
                            <span className="w-6 h-6 rounded-full bg-gold/20 text-navy flex items-center justify-center shrink-0">2</span>
                            You will receive an email letting you know your license is approved.
                        </li>
                    </ul>

                    {/* WhatsApp Action */}
                    <div className="pt-2">
                        <p className="text-xs text-black/50 font-bold uppercase tracking-wider mb-3">Want faster approval?</p>
                        <a 
                            href={`https://wa.me/9779846142530?text=Hello, I just made a payment for "Decoding the Words". My Reference Number is: ${ref}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md"
                        >
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.63 1.438h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            Confirm via WhatsApp
                        </a>
                    </div>
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
        <div className="min-h-screen bg-offwhite pt-44 pb-32 flex items-center justify-center px-6">
            <Suspense fallback={<div className="text-center font-bold text-navy animate-pulse">Loading Receipt...</div>}>
                <SuccessContent />
            </Suspense>
        </div>
    );
}
