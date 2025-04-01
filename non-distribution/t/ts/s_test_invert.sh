#!/bin/bash
# This is a student test

T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/../..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}


url="http://test.com"

echo "$T_FOLDER"/d/invert_input.txt


if $DIFF <(cat "$T_FOLDER"/d/invert_input.txt | c/invert.sh $url | sed 's/[[:space:]]//g' | sort) <(cat "$T_FOLDER"/d/invert_output.txt | sed 's/[[:space:]]//g' | sort) >&2;
then
    echo "$0 success: inverted indices are identical"
    exit 0
else
    echo "$0 failure: inverted indices are not identical"
    exit 1
fi
