import type { Metadata } from "next";
import { Star, Quote } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const metadata: Metadata = {
    title: "Success Stories | Decoding the Words",
    description: "Read how readers transformed their lives using the W-O-R-D framework from Decoding the Words by Er. Sailesh Acharya.",
};

export const revalidate = 60;

const fallbackTestimonials = [
    {
        name: "Priya Sharma",
        location: "Kathmandu",
        role: "Entrepreneur",
        rating: 5,
        quote: "This book completely changed how I speak to myself. I used to say 'I can't do this' every morning. After 21 days of the challenge, my entire inner dialogue shifted.",
        quote_np: "यस पुस्तकले मेरो जीवन नै बदलिदियो।",
        image_path: null
    },
    {
        name: "Rajesh Thapa",
        location: "Pokhara",
        role: "Software Developer",
        rating: 5,
        quote: "The W-O-R-D framework is practical and immediately applicable. I started noticing how my words were limiting my career growth. Three months later, I got a promotion.",
        quote_np: "सरल र व्यावहारिक — जसलाई तुरुन्तै प्रयोग गर्न सकिन्छ।",
        image_path: null
    },
    {
        name: "Anita Gurung",
        location: "Biratnagar",
        role: "Student",
        rating: 5,
        quote: "As a student who struggled with procrastination, the 'Plan B is Not a Backup' chapter hit me hard. I stopped having excuses and started executing.",
        quote_np: "ढिलाइको समस्याबाट मुक्त हुन मद्दत गर्यो।",
        image_path: null
    },
    {
        name: "Bipin Koirala",
        location: "Chitwan",
        role: "Business Owner",
        rating: 5,
        quote: "Er. Sailesh writes with such authenticity. You can feel his 15 years of experience on every page. Not motivational fluff — real, actionable wisdom.",
        quote_np: "वास्तविक अनुभवमा आधारित, अत्यन्त उपयोगी।",
        image_path: null
    },
    {
        name: "Sita Adhikari",
        location: "Lalitpur",
        role: "Teacher",
        rating: 5,
        quote: "The 21-Day Challenge is brilliant. I am using it with my students too and I have seen remarkable changes in their confidence levels.",
        quote_np: "विद्यार्थीहरूलाई पनि अत्यन्त प्रेरणादायी।",
        image_path: null
    },
    {
        name: "Dipesh Rai",
        location: "Dharan",
        role: "Sales Manager",
        rating: 4,
        quote: "The Nepali language makes it so relatable. This is not just another translated Western self-help book. It reflects our own Nepali context perfectly.",
        quote_np: "नेपाली संदर्भ अनुकूल — हाम्रो संस्कृतिसँगै जोडिएको।",
        image_path: null
    },
];

export default async function SuccessStories() {
    const { data: testimonialsData, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

    // Fallback if table doesn't exist or no data is present
    const testimonials = (testimonialsData && testimonialsData.length > 0)
        ? testimonialsData
        : fallbackTestimonials;

    return (
        <div className="min-h-screen bg-offwhite py-28">
            <div className="container mx-auto px-6 max-w-6xl">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-heading font-bold text-navy mb-4">
                        Transforming Lives
                    </h1>
                    <p className="text-xl font-nepali text-black/60 max-w-2xl mx-auto">
                        Hear from readers whose inner dialogue — and outer results — changed forever.
                    </p>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-3 gap-6 mb-16 text-center">
                    {[
                        { val: "500+", label: "Readers" },
                        { val: "4.9★", label: "Avg Rating" },
                        { val: "21", label: "Day Challenge" },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-navy rounded-2xl p-6 text-white">
                            <div className="text-3xl font-heading font-bold text-gold">{stat.val}</div>
                            <div className="text-white/60 font-medium text-sm mt-1">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Testimonials Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testimonials.map((t) => (
                        <div
                            key={t.name}
                            className="bg-white rounded-2xl p-6 border border-black/5 shadow-sm hover:shadow-lg hover:border-gold/30 transition-all flex flex-col"
                        >
                            <div className="flex gap-1 mb-4">
                                {Array(t.rating).fill(null).map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                                ))}
                            </div>

                            <Quote className="w-6 h-6 text-gold/50 mb-3 shrink-0" />
                            <p className="text-black/70 font-medium leading-relaxed mb-4 flex-1">
                                {t.quote}
                            </p>
                            {t.quote_np && (
                                <p className="text-sm font-nepali text-black/40 italic mb-6">
                                    &ldquo;{t.quote_np}&rdquo;
                                </p>
                            )}

                            <div className="border-t border-black/5 pt-4 flex items-center gap-3 mt-auto">
                                <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center font-heading font-bold text-navy text-sm shrink-0 overflow-hidden">
                                    {t.image_path ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={supabase.storage.from("assets").getPublicUrl(t.image_path).data.publicUrl} alt={t.name} className="w-full h-full object-cover" />
                                    ) : (
                                        t.name[0]?.toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-navy text-sm">{t.name}</p>
                                    <p className="text-xs text-black/50">
                                        {t.role} · {t.location}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <a
                        href="/buy"
                        className="inline-flex items-center gap-2 bg-gold hover:bg-gold-light text-navy font-bold px-8 py-4 rounded-xl transition-all shadow-lg"
                    >
                        Join Our Reading Community — NPR 499
                    </a>
                </div>
            </div>
        </div>
    );
}
