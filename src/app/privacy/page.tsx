import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Privacy Policy | Decoding the Words",
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-offwhite py-28">
            <div className="container mx-auto px-6 max-w-3xl">
                <h1 className="text-4xl font-heading font-bold text-navy mb-3">Privacy Policy</h1>
                <p className="text-black/50 font-medium mb-10">Last updated: March 2026</p>

                <div className="bg-white rounded-2xl p-8 md:p-12 border border-black/5 shadow-sm space-y-8 text-black/70 leading-relaxed">
                    {[
                        {
                            title: "1. Information We Collect",
                            body: "We collect your name, email address, and phone number when you make a purchase. We also store your payment screenshot for verification purposes only. We do not collect payment card details.",
                        },
                        {
                            title: "2. How We Use Your Information",
                            body: "Your information is used to verify your payment, create your reading account, and send you account-related communications. We do not sell or share your information with third parties for marketing purposes.",
                        },
                        {
                            title: "3. Data Security",
                            body: "Your data is securely stored using Supabase infrastructure with Row Level Security (RLS) enabled. Payment screenshots are stored in a private, non-publicly accessible storage bucket.",
                        },
                        {
                            title: "4. Cookies",
                            body: "We use minimal session cookies to keep you logged into the reader platform. No third-party tracking cookies are used without your consent.",
                        },
                        {
                            title: "5. Your Rights",
                            body: "You have the right to request deletion of your account and associated personal data. To exercise this right, please contact us at ersaileshacharya@gmail.com.",
                        },
                        {
                            title: "6. Copyright Protection",
                            body: "The contents of this platform are protected by copyright law. Our platform implements technical measures (watermarking, copy/print blocking) to prevent unauthorized reproduction of the book content.",
                        },
                    ].map((section) => (
                        <div key={section.title}>
                            <h2 className="text-lg font-bold text-navy mb-3">{section.title}</h2>
                            <p>{section.body}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-8 text-center">
                    <Link href="/" className="text-sm font-medium text-gold hover:underline">← Back to Home</Link>
                </div>
            </div>
        </div>
    );
}
