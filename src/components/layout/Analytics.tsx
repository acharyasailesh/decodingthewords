"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Analytics() {
    const pathname = usePathname();

    useEffect(() => {
        const fetchAndInit = async () => {
            const { data } = await supabase
                .from("settings")
                .select("google_analytics_id, fb_pixel_id")
                .eq("id", 1)
                .single();

            if (!data) return;

            // 1. Google Analytics
            if (data.google_analytics_id) {
                const gaId = data.google_analytics_id;

                // Track page view on route change
                if (typeof window !== "undefined" && (window as any).gtag) {
                    (window as any).gtag("config", gaId, {
                        page_path: pathname,
                    });
                } else if (!document.getElementById("google-analytics")) {
                    // Initial load
                    const script1 = document.createElement("script");
                    script1.async = true;
                    script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
                    script1.id = "google-analytics-script";
                    document.head.appendChild(script1);

                    const script2 = document.createElement("script");
                    script2.id = "google-analytics";
                    script2.innerHTML = `
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', '${gaId}', {
                            page_path: window.location.pathname,
                        });
                    `;
                    document.head.appendChild(script2);
                }
            }

            // 2. Facebook Pixel
            if (data.fb_pixel_id) {
                const pixelId = data.fb_pixel_id;

                if (typeof window !== "undefined" && (window as any).fbq) {
                    (window as any).fbq('track', 'PageView');
                } else if (!document.getElementById("facebook-pixel")) {
                    const script = document.createElement("script");
                    script.id = "facebook-pixel";
                    script.innerHTML = `
                        !function(f,b,e,v,n,t,s)
                        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                        n.queue=[];t=b.createElement(e);t.async=!0;
                        t.src=v;s=b.getElementsByTagName(e)[0];
                        s.parentNode.insertBefore(t,s)}(window, document,'script',
                        'https://connect.facebook.net/en_US/fbevents.js');
                        fbq('init', '${pixelId}');
                        fbq('track', 'PageView');
                    `;
                    document.head.appendChild(script);

                    const noscript = document.createElement("noscript");
                    noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1" />`;
                    document.head.appendChild(noscript);
                }
            }
        };

        fetchAndInit();
    }, [pathname]);

    return null;
}
