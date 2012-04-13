@echo off

@rem Check that all files have trailing spaces stripped
set OutTrailingSpaceListFile=output\knockout-files-to-clean.txt
cd ..

@rem Totally outlandish way to detect trailing whitespace on non-whitespace-only lines, because the DOS "findstr" command can't handle spaces in regexes.
@rem We should consider changing the whole Windows build script to PowerShell, where this would be trivial and clean.
set foundTrailingWhitespace=0
findstr -rsen -c:" " *.js *.html *.css *.bat *.ps1 > build\%OutTrailingSpaceListFile%
cscript build\tools\searchReplace.js " {2,}" "" build\%OutTrailingSpaceListFile% >nul
for /f "tokens=1,2,* delims=:" %%i in (build\%OutTrailingSpaceListFile%) do @if "%%k" NEQ "" (
    echo Error: Trailing whitespace on %%i line %%j
    set foundTrailingWhitespace=1
)
cd build
del %OutTrailingSpaceListFile%

if %foundTrailingWhitespace% EQU 1 exit /b 1