#!/bin/bash
# make temporary copy of preprocessing folder with all data we need in build
cp -r analysis tmp
# switch to gh-pages branch
git checkout gh-pages
# copy over index file (the processed preprocessing.Rmd) from master branch
cp tmp/preprocessing.html index.html
# clean
rm -rf rscript/
mkdir rscript
# copy over necessary scripts from master branch 
cp tmp/classify.r rscript
cp tmp/numberFormatter.r rscript
cp tmp/preprocessing.Rmd rscript
mkdir rscript/output
# copy over other nessecary output files from master branch
cp tmp/output/verzeichnis_beschreibung.csv rscript/output/
cp tmp/output/signatures_verzeichnis_haupttyp_beschreibung.csv rscript/output/
# copy over other necessary input files from master branch
cp -r tmp/input rscript/
# zip the rscript folder
zip -r rscript.zip rscript
# remove the rscript folder
rm -rf rscript
# remove temporary folder
rm -rf tmp
# add everything for committing
git add .
git add -u
# commit in gh-pages
git commit -m "analysis: build and deploy to gh-pages"
# push to remote:gh-pages
git push origin gh-pages 
# checkout master again
git checkout master