#!/bin/bash

# from - source file to convert
# to - output file


while getopts f:t: flag
do
	case ${flag} in
		f) from=${OPTARG};;
		t) to=${OPTARG};;
	esac
done


echo "f- ${from}"
echo "t- ${to}"
gs -dSAFER \
-dBATCH \
-dNOPAUSE \
-dNOCACHE \
-dPDFX \
-sDEVICE=pdfwrite \
-sColorConversionStrategy=CMYK \
-sOutputFile=${to} ${from}
