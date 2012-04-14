@echo off

@rem Check that all files have trailing spaces stripped
set OutTrailingSpaceListFile=output\knockout-files-to-clean.txt
cd ..
findstr -nrs -c:"[ ]$" *.js *.html *.css *.bat *.ps1 | findstr -rv "^build\\output" > build\%OutTrailingSpaceListFile%
cd build
for %%R in (%OutTrailingSpaceListFile%) do if %%~zR gtr 0 goto :NeedFixTrailingSpace
del %OutTrailingSpaceListFile%
goto :TrailingSpaceOkay

:NeedFixTrailingSpace
echo The following files have trailing spaces that need to be cleaned up:
echo.
type %OutTrailingSpaceListFile%
del %OutTrailingSpaceListFile%
exit /b 1

:TrailingSpaceOkay
