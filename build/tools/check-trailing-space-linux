#!/bin/sh

# Check that all files have trailing spaces stripped
OutTrailingSpaceListFile='output/knockout-files-to-clean.txt'
cd ..
grep -nrI '[ ]$' `find * | grep -E "\.(js|html|css|bat|ps1)$"` | grep -v "^build/output/" > build/$OutTrailingSpaceListFile
cd build
if [ -s $OutTrailingSpaceListFile ]
then
  echo "The following files have trailing spaces that need to be cleaned up:"
  echo ""
  cat $OutTrailingSpaceListFile
  rm $OutTrailingSpaceListFile
  exit 1
fi
rm $OutTrailingSpaceListFile
