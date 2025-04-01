#!/bin/bash
# This is a student test

#Test a word that shows up as part of a term and words that would be processed + stemmed

R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/../..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}

term="punk"

#Test 1 - term does not exist
cat /usr/src/app/non-distribution/t/ts/d/prequery.txt > /usr/src/app/non-distribution/d/global-index.txt

if $DIFF <(./query.js "$term") <(cat /usr/src/app/non-distribution/t/ts/d/postquery.txt) >&2;
then
    echo "$0 test 1 success: search results are identical"
else
    echo "$0 test 1 failure: search results are not identical"
    exit 1
fi

#Test 2 - term is in the phrase
cat /usr/src/app/non-distribution/t/ts/d/prequery2.txt > /usr/src/app/non-distribution/d/global-index.txt
if $DIFF <(./query.js "$term") <(cat /usr/src/app/non-distribution/t/ts/d/postquery2.txt) >&2;
then
    echo "$0 test 2 success: search results are identical"
else
    echo "$0 test 2 failure: search results are not identical"
    exit 1
fi

#Test 3 - multi-word term
term="punk punk punk"

if $DIFF <(./query.js "$term") <(cat /usr/src/app/non-distribution/t/ts/d/postquery3.txt) >&2;
then
    echo "$0 test 3 success: multi-word term search results are identical"
else
    echo "$0 test 3 failure: multi-word term search results are not identical"
    exit 1
fi

#Test 4 - part of a term, but not the whole term
#Ex: if the term we look for is 'plant', but in the index we have 'plantation', that should not match.
term="plant"

if $DIFF <(./query.js "$term") <(cat /usr/src/app/non-distribution/t/ts/d/postquery4.txt) >&2;
then
    echo "$0 test 4 success: synecdoche term search results are identical"
    exit 0
else
    echo "$0 test 4 failure: synecdoche term search results are not identical"
    exit 1
fi