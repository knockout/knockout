@echo off 
set OutDebugFile=output\knockout-latest.debug.js
set OutMinFile=output\knockout-latest.js
set AllFiles=
for /f "eol=] skip=1 delims=' " %%i in (fragments\source-references.js) do set Filename=%%i& call :Concatenate 

set /p Version= <fragments\version.txt
set VersionHeaderPath=fragments\version-header.js
set VersionJsFile=..\src\version.js
tools\sed "s/##VERSION##/%Version%/" <%VersionHeaderPath% > %VersionHeaderPath%.temp
tools\sed "s/Working-Debug/%Version%/" <%VersionJsFile% > %VersionJsFile%.temp

goto :Combine
:Concatenate 
    if /i "%Filename%"=="src/version.js" (
        set Filename="src/version.js.temp"
    )

    if /i "%AllFiles%"=="" ( 
        set AllFiles=..\%Filename:/=\%
    ) else ( 
        set AllFiles=%AllFiles% ..\%Filename:/=\%
    ) 
goto :EOF 

:Combine
type fragments\amd-pre.js         > %OutDebugFile%.temp
type %AllFiles%                   >> %OutDebugFile%.temp
type fragments\amd-post.js        >> %OutDebugFile%.temp

@rem Now call Google Closure Compiler to produce a minified version
tools\curl -d output_info=compiled_code -d output_format=text -d compilation_level=ADVANCED_OPTIMIZATIONS --data-urlencode js_code@%OutDebugFile%.temp "http://closure-compiler.appspot.com/compile" > %OutMinFile%.temp

@rem Finalise each file by prefixing with version header and surrounding in function closure
copy /y fragments\version-header.js.temp %OutDebugFile%
echo (function(window,document,navigator,undefined){ >> %OutDebugFile%
type %OutDebugFile%.temp                             >> %OutDebugFile%
echo })(window,document,navigator);                  >> %OutDebugFile%
del %OutDebugFile%.temp

copy /y fragments\version-header.js.temp %OutMinFile%
echo (function(window,document,navigator,undefined){ >> %OutMinFile%
type %OutMinFile%.temp                               >> %OutMinFile%
echo })(window,document,navigator);                  >> %OutMinFile%
del %OutMinFile%.temp

del %VersionHeaderPath%.temp
del %VersionJsFile%.temp
