#!/bin/bash
# This is a student test

R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/../..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}


if $DIFF <(cat /usr/src/app/non-distribution/t/ts/d/prestem.txt | c/stem.js | sort) <(sort /usr/src/app/non-distribution/t/ts/d/poststem.txt) >&2;
then
    echo "$0 success: stemmed words are identical"
    exit 0
else
    echo "$0 failure: stemmed words are not identical"
    exit 1
fi
