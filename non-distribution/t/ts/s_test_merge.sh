#!/bin/bash
# This is a student test

R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/../..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}
DIFF_PERCENT=${DIFF_PERCENT:-0}

cat /dev/null > /usr/src/app/non-distribution/t/ts/d/globalmerge.txt

files=(/usr/src/app/non-distribution/t/ts/d/premerge{1..2}.txt)

for file in "${files[@]}"
do
    cat "$file" | c/merge.js /usr/src/app/non-distribution/t/ts/d/globalmerge.txt > /usr/src/app/non-distribution/t/ts/d/temp-global-index.txt
    mv /usr/src/app/non-distribution/t/ts/d/temp-global-index.txt /usr/src/app/non-distribution/t/ts/d/globalmerge.txt
done


if DIFF_PERCENT=$DIFF_PERCENT t/gi-diff.js <(sort /usr/src/app/non-distribution/t/ts/d/globalmerge.txt) <(sort /usr/src/app/non-distribution/t/ts/d/postmerge.txt) >&2;
then
    echo "$0 success: global indexes are identical"
    exit 0
else
    echo "$0 failure: global indexes are not identical"
    exit 1
fi
