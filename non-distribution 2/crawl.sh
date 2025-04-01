#!/bin/bash

echo "$1" >>d/visited.txt

curl -skL "$1" -A "Mozilla/5.0 (compatible;  MSIE 7.01; Windows NT 5.0)" |
  tee >(c/getURLs.js "$1" | grep -vxf d/visited.txt >>d/urls.txt) |
  c/getText.js
