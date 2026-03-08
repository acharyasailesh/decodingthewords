
$path = "d:\decodingthewords\src\app\read\page.tsx"
$content = Get-Content $path -Raw

# 1. Remove duplicate .eq line
$content = $content -replace "\.eq\(`"user_id`", session\.user\.id\)\s+\.eq\(`"user_id`", session\.user\.id\);", ".eq(`"user_id`", session.user.id);"

# 2. Make progress math dynamic based on chapterData length
$content = $content -replace "Math\.round\(\(uniqueChapters\.size / 20\) \* 100\)", "Math.round((uniqueChapters.size / (chapterData ? chapterData.length : 20)) * 100)"

Set-Content -Path $path -Value $content -NoNewline
