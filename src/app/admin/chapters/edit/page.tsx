"use client";

import { useSearchParams } from "next/navigation";
import ChapterEditor from "@/components/admin/ChapterEditor";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

function EditorContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id") || "new";

    return <ChapterEditor chapterId={id} />;
}

export default function EditPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-24"><Loader2 className="w-7 h-7 animate-spin text-gold" /></div>}>
            <EditorContent />
        </Suspense>
    );
}
