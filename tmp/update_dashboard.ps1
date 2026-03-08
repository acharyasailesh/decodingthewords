
$path = "d:\decodingthewords\src\app\read\page.tsx"
$content = Get-Content -Path $path -Raw

# 1. Update framework letters injection
$oldCode = '@\{section.chapters.map\(\(chap: any, i: number\) => \{
                                                    const chapIdx = chapters.findIndex\(c => c.chapter_id === chap.chapter_id\);'
$newCode = '{section.chapters.map((chap: any, i: number) => {
                                                    const chapIdx = chapters.findIndex(c => c.chapter_id === chap.chapter_id);
                                                    const frameworkMap: Record<string, string> = {
                                                        "ch-1": "W",
                                                        "ch-2": "O",
                                                        "ch-3": "R",
                                                        "ch-4": "D"
                                                    };
                                                    const frameworkLetter = frameworkMap[chap.chapter_id];'

# We'll use a literal replacement for the first part we find
$content = $content.Replace('                                                {section.chapters.map((chap: any, i: number) => {
                                                    const chapIdx = chapters.findIndex(c => c.chapter_id === chap.chapter_id);', 
                            '                                                {section.chapters.map((chap: any, i: number) => {
                                                    const chapIdx = chapters.findIndex(c => c.chapter_id === chap.chapter_id);
                                                    const frameworkMap: Record<string, string> = {
                                                        "ch-1": "W",
                                                        "ch-2": "O",
                                                        "ch-3": "R",
                                                        "ch-4": "D"
                                                    };
                                                    const frameworkLetter = frameworkMap[chap.chapter_id];')

# 2. Add framework background letter UI
$content = $content.Replace('<div className={`relative z-10 ${tc.card} backdrop-blur-3xl border rounded-[3rem] p-10 transition-all duration-700 flex flex-col gap-8 ${hoveredIdx === chapIdx && !isLocked ? `border-gold/50 shadow-[0_30px_80px_rgba(0,0,0,0.5)] -translate-y-4` : "shadow-2xl border-white/5"}`}>\s+<div>', 
                            '<div className={`relative z-10 ${tc.card} backdrop-blur-3xl border rounded-[3rem] p-10 transition-all duration-700 flex flex-col gap-8 ${hoveredIdx === chapIdx && !isLocked ? `border-gold/50 shadow-[0_30px_80px_rgba(0,0,0,0.5)] -translate-y-4` : "shadow-2xl border-white/5"}`}>
                                                                    {/* Framework background letter */}
                                                                    {frameworkLetter && (
                                                                        <div className="absolute top-10 right-10 text-[120px] font-heading font-black opacity-[0.03] select-none pointer-events-none group-hover:opacity-[0.08] transition-opacity leading-none">
                                                                            {frameworkLetter}
                                                                        </div>
                                                                    )}
                                                                    <div>')

# 3. Add framework badge UI
$content = $content.Replace('<span className={`text-[10px] font-black uppercase tracking-[0.4em] ${st.accent}`}>Selection {chap.order_index}</span>', 
                            '<div className="flex items-center gap-3">
                                                                                <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${st.accent}`}>Selection {chap.order_index}</span>
                                                                                {frameworkLetter && (
                                                                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gold/10 text-gold text-[10px] font-black border border-gold/20">{frameworkLetter}</span>
                                                                                )}
                                                                            </div>')

Set-Content -Path $path -Value $content -NoNewline
