
$path = "d:\decodingthewords\src\app\read\page.tsx"
$lines = Get-Content $path
$newLines = @()

foreach ($line in $lines) {
    $newLines += $line
    if ($line -like "*const chapIdx = chapters.findIndex*") {
        $newLines += '                                                    const frameworkLetter = ({"ch-1":"W","ch-2":"O","ch-3":"R","ch-4":"D"} as any)[chap.chapter_id];'
    }
}

Set-Content -Path $path -Value $newLines
