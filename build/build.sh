#!/bin/sh

handle_fail() {
    echo; echo "Build failed"
    exit 1
}

# Ensure we're in the build directory
cd `dirname $0`

tools/check-trailing-space.sh || handle_fail

OutDebugFile='output/knockout-latest.debug.js'
OutMinFile='output/knockout-latest.js'

# Delete output and temporary files (ensures we can writ to them)
rm -f $OutDebugFile $OutMinFile $OutDebugFile.temp $OutMinFile.temp

# Combine the source files
SourceFiles=`grep js < fragments/source-references.js | # Find JS references
             sed "s/[ \',]//g" |                        # Strip off JSON fluff (whitespace, commas, quotes)
             sed -e 's/.*/..\/&/' |                     # Fix the paths by prefixing with ../
             tr '\n' ' '`                               # Combine into single line
cat fragments/extern-pre.js         > $OutDebugFile.temp
cat fragments/amd-pre.js            >> $OutDebugFile.temp
cat $SourceFiles                    >> $OutDebugFile.temp || handle_fail
cat fragments/amd-post.js           >> $OutDebugFile.temp
cat fragments/extern-post.js        >> $OutDebugFile.temp

# Now call Google Closure Compiler to produce a minified version
curl -d output_info=compiled_code -d output_format=text -d compilation_level=ADVANCED_OPTIMIZATIONS --data-urlencode output_wrapper="(function() {%output%})();" --data-urlencode "js_code=/**@const*/var DEBUG=false;" --data-urlencode js_code@$OutDebugFile.temp "http://closure-compiler.appspot.com/compile" > $OutMinFile.temp

# Finalise each file by prefixing with version header and surrounding in function closure
cp fragments/version-header.js $OutDebugFile
echo "(function(){"                 >> $OutDebugFile
echo "var DEBUG=true;"              >> $OutDebugFile
cat $OutDebugFile.temp              >> $OutDebugFile
echo "})();"                        >> $OutDebugFile
rm $OutDebugFile.temp

cp fragments/version-header.js $OutMinFile
cat $OutMinFile.temp                >> $OutMinFile
rm $OutMinFile.temp

# Pull the version number out of package.json and inject it into the built output files
Version=`sed -n 's/.*"version":\s*"\([^"]*\)".*/\1/p' ../package.json`
sed -i~ -e "s/##VERSION##/$Version/g" $OutDebugFile $OutMinFile

# Delete the odd files left behind on Mac
rm -f output/*.js~

# Run tests in Phantomjs if available
if command -v phantomjs >/dev/null
then
  (cd ..; echo; phantomjs spec/runner.phantom.js) || handle_fail
fi

# Run tests in Nodejs if available
if command -v node >/dev/null
then
  (cd ..; echo; node spec/runner.node.js) || handle_fail
fi

echo; echo "Build succeeded"
