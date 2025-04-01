#!/usr/bin/env node

/*
Search the inverted index for a particular (set of) terms.
Usage: ./query.js your search terms

The behavior of this JavaScript file should be similar to the following shell pipeline:
grep "$(echo "$@" | ./c/process.sh | ./c/stem.js | tr "\r\n" "  ")" d/global-index.txt

Here is one idea on how to develop it:
1. Read the command-line arguments using `process.argv`. A user can provide any string to search for.
2. Normalize, remove stopwords from and stem the query string — use already developed components
3. Search the global index using the processed query string.
4. Print the matching lines from the global index file.

Examples:
./query.js A     # Search for "A" in the global index. This should return all lines that contain "A" as part of an 1-gram, 2-gram, or 3-gram.
./query.js A B   # Search for "A B" in the global index. This should return all lines that contain "A B" as part of a 2-gram, or 3-gram.
./query.js A B C # Search for "A B C" in the global index. This should return all lines that contain "A B C" as part of a 3-gram.

Note: Since you will be removing stopwords from the search query, you will not find any matches for words in the stopwords list.

The simplest way to use existing components is to call them using execSync.
For example, `execSync(`echo "${input}" | ./c/process.sh`, {encoding: 'utf-8'});`
*/


const fs = require('fs');
const {execSync} = require('child_process');
// const path = require('path');
// const {StemmerId} = require('natural');

/* JDZHOU IMPLEMENTATION */

function query(indexFile, args) {
  // Process the keywords by calling process and stem
  // Make the input args all one long string
  let inputParams = '';
  for (let i = 0; i < args.length; i++) {
    inputParams = inputParams + args[i] + ' ';
  }
  let keywords = execSync(`echo "${inputParams}" | ./c/process.sh | ./c/stem.js`, {encoding: 'utf-8'}).trim();
  // put the keywords back into one line
  const keywordArr = keywords.split('\n');
  keywords = '';
  for (const keyword of keywordArr) {
    keywords += keyword + ' ';
  }
  keywords = keywords.trim();

  // check that the file actually exists lol
  if (!fs.existsSync(indexFile)) {
    console.error(`Error: The file ${indexFile} does not exist.`);
    process.exit(1);
  }
  // read the file using fs.readFile();
  fs.readFile(indexFile, 'utf-8', (err, data) => {
    if (err) {
      console.error('Error while reading the global index file.');
      return;
    }

    findMatches(data, keywords);
  });
}

/* Helper function for query. Takes in the text from global-index.txt
and parses it to look for any matching words */
const findMatches = (data, keywords) => {
  const globalLines = data.split('\n');
  for (const line of globalLines) {
    const term = line.split(' | ')[0];
    // check if keywords are a substring of term
    // hmm... what if it's a substring, but not the full word? --> use regex not includes
    const regex = new RegExp(`\\b${keywords}\\b`); // Searched up this regex.
    if (regex.test(term)) {
      console.log(line);
    }
  }
};

/* END OF JDZHOU IMPLEMENTATION */

const args = process.argv.slice(2); // Get command-line arguments
if (args.length < 1) {
  console.error('Usage: ./query.js [query_strings...]');
  process.exit(1);
}

const indexFile = 'd/global-index.txt'; // Path to the global index file
query(indexFile, args);
