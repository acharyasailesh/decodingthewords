# Automatically prepare the deployment folder for cPanel
Write-Host "Starting Production Build..."
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Build failed. Please check the logs."
    exit
}

$deployFolder = "deploy_me"
if (Test-Path $deployFolder) {
    Write-Host "Cleaning existing $deployFolder..."
    Remove-Item -Path $deployFolder -Recurse -Force
}

Write-Host "Creating deployment folder structure..."
New-Item -ItemType Directory -Path $deployFolder | Out-Null
New-Item -ItemType Directory -Path "$deployFolder/.next" | Out-Null

# 1. Copy standalone contents
Write-Host "Copying standalone server files..."
Copy-Item -Path ".next/standalone/*" -Destination "$deployFolder/" -Recurse -Force

# 2. Copy static files into .next/static
Write-Host "Copying static assets..."
New-Item -ItemType Directory -Path "$deployFolder/.next/static" | Out-Null
Copy-Item -Path ".next/static/*" -Destination "$deployFolder/.next/static/" -Recurse -Force

# 3. Copy public folder
Write-Host "Copying public folder..."
Copy-Item -Path "public" -Destination "$deployFolder/public" -Recurse -Force

Write-Host "Success! Your deployment files are ready in the '$deployFolder' directory."
Write-Host "You can now ZIP the contents of '$deployFolder' and upload them to cPanel."
