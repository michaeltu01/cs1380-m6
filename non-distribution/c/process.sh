#!/bin/bash

# Convert input to a stream of non-stopword terms
# Usage: ./process.sh < input > output

# Convert each line to one word per line, **remove non-letter characters**, make lowercase, convert to ASCII; then remove stopwords (inside d/stopwords.txt)
# Commands that will be useful: tr, iconv, grep

# JDZHOU IMPLEMENTATION

# $1 is how to access the first argument
# tr ' ' '\n' is how to replace spaces with newlines
# the test pipes the input, so it comes through stdin not cmdline.
# tr -dc '[:alpha:]\n' is how to remove non-letter characters while retaining the new lines
# tr '[:upper:]' '[:lower:]' transforms all uppercase characters to lowercase
# iconv -f UTF-8 -t ASCII//TRANSLIT converts the utf-8 html to ascii
# grep -vFix -f "($stopwords)" filters out words that match stopwords. -v inverts match, -x matches lines -F treats file as strings and not refex, -i ignores cases, -f treats next parameter as file path
cat | tr ' ' '\n' | tr -c '[:alpha:]\n' '\n' | tr '[:upper:]' '[:lower:]' | iconv -f UTF-8 -t ASCII//TRANSLIT | grep -vFix -f d/stopwords.txt

#NOTE: Super annoying windows bug -- grep won't work between 2 txt files with different line endings (bash was using unix line endings LF and stopwords.txt was using CRLF)

# END OF JDZHOU IMPLEMENTATION