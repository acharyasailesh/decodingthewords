
$path = "d:\decodingthewords\src\app\read\page.tsx"
$content = Get-Content -Path $path -Raw

# Update frameworkLetter calculation to be section-based
$targetPattern = 'const frameworkLetter = \(\{"ch-1":"W","ch-2":"O","ch-3":"R","ch-4":"D"\} as any\)\[chap.chapter_id\];'
$replacement = 'const sectionLetters = ["W", "O", "R", "D"];
                                                    const frameworkLetter = sectionLetters[sIdx] || "G";'

$newContent = $content -replace [regex]::Escape($targetPattern), $replacement

Set-Content -Path $path -Value $newContent -NoNewline
