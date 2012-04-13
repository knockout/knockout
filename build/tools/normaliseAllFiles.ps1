# If needed, first run: Set-ExecutionPolicy Unrestricted

$allFiles = (Get-ChildItem -Path ..\..\ -Include *.js,*.css,*.bat -Recurse)

$allFiles | %{
    # Read file, output back to file in CP1252 format (default for Git on Windows)
    # This will also ensure the file has a trailing linebreak
    Write-Host "Processing $_..."
    $fileContent = Get-Content $_    
    [System.IO.File]::WriteAllLines($_, $fileContent, [System.Text.Encoding]::GetEncoding(1252))
}