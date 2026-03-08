// SERVER COMPONENT: exports generateStaticParams for static export
import ReaderMode from "./ReaderMode";
import { Suspense } from "react";

// All known chapter + special section IDs — hardcoded so static export
// always works even when the DB is empty at build time.
// The client ReaderMode component fetches the real content at runtime.
const ALL_CHAPTER_IDS = [
    "ch-1", "ch-2", "ch-3", "ch-4", "ch-5", "ch-6", "ch-7",
    "ch-8", "ch-9", "ch-10", "ch-11", "ch-12", "ch-13",
    "epilogue", "challenge-21", "problem-index", "references",
    "acknowledgement", "about-author", "the-blurb"
];

export function generateStaticParams() {
    return ALL_CHAPTER_IDS.map((id) => ({ chapterId: id }));
}

export default async function ChapterPage({ params }: { params: Promise<{ chapterId: string }> }) {
    const { chapterId } = await params;
    return (
        <Suspense fallback={null}>
            <ReaderMode chapterId={chapterId} />
        </Suspense>
    );
}
