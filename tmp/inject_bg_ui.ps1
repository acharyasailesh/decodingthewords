
$path = "d:\decodingthewords\src\app\read\page.tsx"
$content = Get-Content $path -Raw
$target = '<div className={`relative z-10 ${tc.card} backdrop-blur-3xl border rounded-[3rem] p-10 transition-all duration-700 flex flex-col gap-8 ${hoveredIdx === chapIdx && !isLocked ? `border-gold/50 shadow-[0_30px_80px_rgba(0,0,0,0.5)] -translate-y-4` : "shadow-2xl border-white/5"}`}>'
$injection = @"

                                                                    {/* Framework background letter */}
                                                                    {frameworkLetter && (
                                                                        <div className="absolute top-10 right-10 text-[120px] font-heading font-black opacity-[0.03] select-none pointer-events-none group-hover:opacity-[0.08] transition-opacity leading-none">
                                                                            {frameworkLetter}
                                                                        </div>
                                                                    )}
"@

# We use -replace to insert after the target
$newContent = $content -replace [regex]::Escape($target), ($target + $injection)
Set-Content -Path $path -Value $newContent -NoNewline
