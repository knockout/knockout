@echo off 
set AllFiles=
for /f "eol=] skip=1 delims=' " %%i in (source-references.js) do set Filename=%%i& call :Concatenate 

goto :Combine
:Concatenate 
    if /i "%AllFiles%"=="" ( 
        set AllFiles=..\%Filename:/=\%
    ) else ( 
        set AllFiles=%AllFiles%+..\%Filename:/=\%
    ) 
goto :EOF 

:Combine
copy /A /B version-header.js+%AllFiles% output\knockout-latest.js

@rem Now call Google Closure Compiler to produce a minified version
copy /y version-header.js output\knockout-latest.min.js
tools\curl -d output_info=compiled_code -d output_format=text -d compilation_level=SIMPLE_OPTIMIZATIONS --data-urlencode js_code@output\knockout-latest.js "http://closure-compiler.appspot.com/compile" >> output\knockout-latest.min.js
