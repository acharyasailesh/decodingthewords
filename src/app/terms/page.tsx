import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Terms of Service | Decoding the Words",
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-offwhite py-28">
            <div className="container mx-auto px-6 max-w-3xl">
                <h1 className="text-4xl font-heading font-bold text-navy mb-3">Terms of Service</h1>
                <p className="text-black/50 font-medium mb-10">Last updated: March 2026</p>

                <div className="bg-white rounded-2xl p-8 md:p-12 border border-black/5 shadow-sm space-y-8 text-black/70 leading-relaxed">
                    {[
                        {
                            title: "1. License Agreement",
                            body: "Upon successful payment verification, you are granted a single-user, non-transferable, lifetime digital license to access the book content online through our platform. This license is personal to you and may not be shared.",
                        },
                        {
                            title: "2. No Downloads / No Printing",
                            body: "The digital license grants online reading access only. Downloading the content in any format (PDF, EPUB, etc.) or printing is strictly prohibited. Technical measures are in place to enforce this restriction.",
                        },
                        {
                            title: "3. Copyright",
                            body: "All content in 'Decoding the Words' is the intellectual property of Er. Sailesh Acharya. Reproduction, distribution, or creation of derivative works without explicit written permission is a violation of copyright law.",
                        },
                        {
                            title: "4. Payment & Refunds",
                            body: "All purchases are final. We operate a manual review process for payment verification. If your payment is rejected due to an invalid screenshot, you will be notified and can resubmit. Refunds are not available for approved licenses.",
                        },
                        {
                            title: "5. Account Termination",
                            body: "We reserve the right to terminate your access if we detect attempts to circumvent our anti-piracy measures, share your account credentials, or submit fraudulent payment proofs.",
                        },
                        {
                            title: "6. Contact",
                            body: "For any service-related issues, please contact ersaileshacharya@gmail.com.",
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
