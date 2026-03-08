"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith("/admin");
    const isReader = pathname?.startsWith("/read");

    return (
        <>
            {!isAdmin && !isReader && <Navbar />}
            {children}
            {!isAdmin && !isReader && <Footer />}
        </>
    );
}
