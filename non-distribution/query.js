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
const path = require('path');

function processSearchTerms(args) {
  try {
    const searchString = args.join(' ');

    // process the search string through process and stem
    const processPath = path.join('.', 'c', 'process.sh');
    const stemPath = path.join('.', 'c', 'stem.js');

    const processed = execSync(`echo "${searchString}" | ${processPath}`, {
      encoding: 'utf-8',
      // Allow non-zero exit codes to not throw an error
      stdio: 'pipe',
    });

    // If nothing was returned after processing, handle that case
    if (!processed.trim()) {
      return '';
    }

    const stemmed = execSync(`echo "${processed}" | ${stemPath}`, {
      encoding: 'utf-8',
    });

    return stemmed.replace(/[\r\n]+/g, ' ').trim();
  } catch (error) {
    console.error('Error processing search terms:', error.message);
    process.exit(1);
  }
}

function query(indexFile, args) {
  try {
    if (!fs.existsSync(indexFile)) {
      console.error(`Error: Index file '${indexFile}' not found`);
      process.exit(1);
    }

    const processedQuery = processSearchTerms(args);

    if (!processedQuery) {
      console.error('No valid search terms after processing');
      process.exit(1);
    }

    // search index file
    const indexContent = fs.readFileSync(indexFile, 'utf-8');
    const lines = indexContent.split('\n');

    // find matches in index
    for (const line of lines) {
      if (!line.trim()) continue;

      const [term] = line.split('|');
      if (term.trim().includes(processedQuery)) {
        console.log(line.trim());
      }
    }
  } catch (error) {
    console.error('Error during query:', error.message);
    process.exit(1);
  }
}

const args = process.argv.slice(2); // Get command-line arguments
if (args.length < 1) {
  console.error('Usage: ./query.js [query_strings...]');
  process.exit(1);
}

const indexFile = 'd/global-index.txt'; // Path to the global index file
query(indexFile, args);
