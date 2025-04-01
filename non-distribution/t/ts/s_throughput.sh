#!/bin/bash
# This is a student test

R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/../..$R_FOLDER" || exit 1

#The idea is to only run one of these loops at a time, and use the time command
#to find how long they take. Then, divide the # of URLs or queries processed by the time.

#Crawl 20 URLs
# for i in {1..20};
# do
#     ./crawl.sh https://cs.brown.edu/courses/csci1380/sandbox/4/ > d/content.txt
# done

#Index pages in d/content.txt
# for i in {1..20};
# do
#     ./index.sh d/content.txt https://cs.brown.edu/courses/csci1380/sandbox/4/
# done

#Query 20 things
# for i in {1..20};
# do
#     ./query.js tag
# done
