
$path = "d:\decodingthewords\src\app\read\page.tsx"
$lines = Get-Content $path
$newLines = @()

foreach ($line in $lines) {
    if ($line -like "*const frameworkLetter = (*") {
        # Replace the line with section-based logic
        # Note: We need to make sure we have access to sIdx.
        # sIdx is available in the outer scope of the section.map
        $newLines += '                                                    const sectionLetters = ["W", "O", "R", "D"];'
        $newLines += '                                                    const frameworkLetter = sectionLetters[sIdx] || "G";'
    } else {
        $newLines += $line
    }
}

Set-Content $path $newLines
