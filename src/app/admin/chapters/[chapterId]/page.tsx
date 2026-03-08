// SERVER COMPONENT: needed for generateStaticParams with output: export
import ChapterEditor from "./ChapterEditor";

const ALL_IDS = [
    "new", "ch-1", "ch-2", "ch-3", "ch-4", "ch-5", "ch-6", "ch-7",
    "ch-8", "ch-9", "ch-10", "ch-11", "ch-12", "ch-13",
    "epilogue", "challenge-21", "problem-index", "references",
    "acknowledgement", "about-author", "the-blurb"
];

export function generateStaticParams() {
    return ALL_IDS.map((id) => ({ chapterId: id }));
}

export default async function ChapterEditorPage({ params }: { params: Promise<{ chapterId: string }> }) {
    const { chapterId } = await params;
    return <ChapterEditor chapterId={chapterId} />;
}
