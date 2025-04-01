#!/bin/bash
# This is a student test

T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/../..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}

url="https://itbusiness.com"


if $DIFF <(cat "$T_FOLDER"/d/ds_web_html.txt | c/getURLs.js $url | sort) <(sort "$T_FOLDER"/d/ds_urls_output.txt) >&2;
then
    echo "$0 success: URL sets are identical"
    exit 0
else
    echo "$0 failure: URL sets are not identical"
    exit 1
fi