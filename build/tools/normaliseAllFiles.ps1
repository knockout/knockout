# If needed, first run: Set-ExecutionPolicy Unrestricted

$allFiles = (Get-ChildItem -Path ..\..\ -Include *.js,*.css,*.bat,*.html -Recurse)

$allFiles | %{
    # Read file, remove trailing spaces/tabs, output back to file in CP1252 format (default for Git on Windows)
    # This will also ensure the file has a trailing linebreak
    Write-Host "Processing $_..."
    $fileContent = (Get-Content $_) -replace "[ \t]+$", ""
    [System.IO.File]::WriteAllLines($_, $fileContent, [System.Text.Encoding]::GetEncoding(1252))
}