@echo off

call tools/check-trailing-space-windows.bat
if %errorlevel% NEQ 0 goto Fail

set OutDebugFile=output\knockout-latest.debug.js
set OutMinFile=output\knockout-latest.js
set AllFiles=
for /f "eol=] skip=1 delims=' " %%i in (fragments\source-references.js) do set Filename=%%i& call :Concatenate

goto :Combine
:Concatenate
    if /i "%AllFiles%"=="" (
        set AllFiles=..\%Filename:/=\%
    ) else (
        set AllFiles=%AllFiles% ..\%Filename:/=\%
    )
goto :EOF

:Combine
type fragments\amd-pre.js         > %OutDebugFile%.temp
type %AllFiles%                   >> %OutDebugFile%.temp 2>nul
type fragments\amd-post.js        >> %OutDebugFile%.temp

@rem Now call Google Closure Compiler to produce a minified version
tools\curl -d output_info=compiled_code -d output_format=text -d compilation_level=ADVANCED_OPTIMIZATIONS --data-urlencode "js_code=/**@const*/var DEBUG=false;" --data-urlencode js_code@%OutDebugFile%.temp "http://closure-compiler.appspot.com/compile" > %OutMinFile%.temp

@rem Finalise each file by prefixing with version header and surrounding in function closure
copy /y fragments\version-header.js %OutDebugFile% >nul
echo (function(window,document,navigator,undefined){>> %OutDebugFile%
echo var DEBUG=true;>> %OutDebugFile%
type %OutDebugFile%.temp                            >> %OutDebugFile%
echo })(window,document,navigator);>> %OutDebugFile%
del %OutDebugFile%.temp

copy /y fragments\version-header.js %OutMinFile% >nul
echo (function(window,document,navigator,undefined){>> %OutMinFile%
type %OutMinFile%.temp                              >> %OutMinFile%
echo })(window,document,navigator);>> %OutMinFile%
del %OutMinFile%.temp

@rem Inject the version number string
set /p Version= <fragments\version.txt
cscript tools\searchReplace.js "##VERSION##" %VERSION% %OutDebugFile% %OutMinFile% >nul
cscript tools\searchReplace.js "\r\n" "\n" %OutDebugFile%  %OutMinFile% >nul

echo.
echo Build succeeded
exit /b 0

:Fail
echo.
echo Build failed
