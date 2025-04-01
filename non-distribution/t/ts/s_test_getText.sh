#!/bin/bash
# This is a student test

R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/../..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}


if $DIFF <(cat /usr/src/app/non-distribution/t/ts/d/pretext.txt | c/getText.js | sort) <(sort /usr/src/app/non-distribution/t/ts/d/posttext.txt) >&2;
then
    echo "$0 success: texts are identical"
    exit 0
else
    echo "$0 failure: texts are not identical"
    exit 1
fi
