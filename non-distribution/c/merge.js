#!/usr/bin/env node

/*
Merge the current inverted index (assuming the right structure) with the global index file
Usage: cat input | ./merge.js global-index > output

The inverted indices have the different structures!

Each line of a local index is formatted as:
  - `<word/ngram> | <frequency> | <url>`

Each line of a global index is be formatted as:
  - `<word/ngram> | <url_1> <frequency_1> <url_2> <frequency_2> ... <url_n> <frequency_n>`
  - Where pairs of `url` and `frequency` are in descending order of frequency
  - Everything after `|` is space-separated

-------------------------------------------------------------------------------------
Example:

local index:
  word1 word2 | 8 | url1
  word3 | 1 | url9
EXISTING global index:
  word1 word2 | url4 2
  word3 | url3 2

merge into the NEW global index:
  word1 word2 | url1 8 url4 2
  word3 | url3 2 url9 1

Remember to error gracefully, particularly when reading the global index file.
*/

const fs = require('fs');
const readline = require('readline');
// The `compare` function can be used for sorting.
const compare = (a, b) => {
  if (a.freq > b.freq) {
    return -1;
  } else if (a.freq < b.freq) {
    return 1;
  } else {
    return 0;
  }
};
const rl = readline.createInterface({
  input: process.stdin,
});

/* JDZHOU IMPLEMENTATION */

// 1. Read the incoming local index data from standard input (stdin) line by line.
let localIndex = '';
rl.on('line', (line) => {
  localIndex += line + '\n';
});

rl.on('close', () => {
  // 2. Read the global index name/location, using process.argv
  // and call printMerged as a callback
  const globalIndexPath = process.argv[2];

  // check that the file actually exists lol
  if (!fs.existsSync(globalIndexPath)) {
    console.error(`Error: The file ${globalIndexPath} does not exist.`);
    process.exit(1);
  }
  // read the file using fs.readFile();
  fs.readFile(globalIndexPath, 'utf-8', (err, data) => {
    if (err) {
      printMerged(err, null);
    }

    printMerged(null, data);
  });
});

const printMerged = (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Split the data into an array of lines
  const localIndexLines = localIndex.split('\n');
  const globalIndexLines = data.split('\n');
  // console.error(globalIndexLines);

  localIndexLines.pop();
  globalIndexLines.pop();

  const local = {};
  const global = {};

  // 3. For each line in `localIndexLines`, parse them and add them to the `local` object where keys are terms and values contain `url` and `freq`.
  for (const line of localIndexLines) {
    // each line has format: `<word/ngram> | <frequency> | <url>`
    const components = line.split(' | ');
    if (components.length != 3) {
      console.error('Error: illformed format for local line');
      continue;
    }
    const term = components[0].trim();
    const freq = components[1].trim();
    const url = components[2].trim();
    local[term] = {url, freq}; // this creates an object that has field names url and freq
  }

  // 4. For each line in `globalIndexLines`, parse them and add them to the `global` object where keys are terms and values are arrays of `url` and `freq` objects.
  // Use the .trim() method to remove leading and trailing whitespace from a string.
  for (const line of globalIndexLines) {
    // `<word/ngram> | <url_1> <frequency_1> <url_2> <frequency_2> ... <url_n> <frequency_n>`
    const components = line.split(' | ');
    if (components.length != 2) {
      console.error('line: ' + line);
      console.error('Error: illformed format for global line. Only ${components.length} components long');
      continue;
    }
    const term = components[0].trim();
    const urlFreqString = components[1].trim();
    const urlFreqArr = urlFreqString.split(' '); // urlFreqArr will be alternating urls and frequencies.
    // check for even number of elements
    if (urlFreqArr.length % 2 != 0) {
      console.error('Error: malformed urlFreqArr length. Not even.');
      continue;
    }
    const urlfs = [];

    for (let i = 0; i < urlFreqArr.length-1; i += 2) {
      const url = urlFreqArr[i];
      const freq = parseInt(urlFreqArr[i+1], 10);
      const pair = {url, freq};
      urlfs.push(pair);
    }
    // console.error(urlfs);
    global[term] = urlfs; // Array of {url, freq} objects
  }

  // 5. Merge the local index into the global index:
  // - For each term in the local index, if the term exists in the global index:
  //     - Append the local index entry to the array of entries in the global index.
  //     - Sort the array by `freq` in descending order.
  // - If the term does not exist in the global index:
  //     - Add it as a new entry with the local index's data.
  for (const localTerm in local) {
    const urlFreqPair = local[localTerm];
    // check if the local term exists in the global
    if (localTerm in global) {
      // if it does, append to the array of entries in global and re-sort
      global[localTerm].push(urlFreqPair);
      global[localTerm].sort(compare);
    } else {
      // if it doesn't, add a new entry into global with local index data
      global[localTerm] = [urlFreqPair];
    }
  }

  // 6. Print the merged index to the console in the same format as the global index file:
  //    - Each line contains a term, followed by a pipe (`|`), followed by space-separated pairs of `url` and `freq`.
  for (const globalTerm in global) {
    process.stdout.write(globalTerm + ' | ');
    const urlfs = global[globalTerm];
    for (let i = 0; i < urlfs.length; i++) {
      const curPair = urlfs[i];
      // NOTE: the fields of the pair object have to be accessed through url and freq. Can't index in to an object as you would an array.
      const curUrl = curPair.url;
      const curFreq = curPair.freq;
      process.stdout.write(curUrl + ' ' + curFreq + ' ');
    }
    process.stdout.write('\n');
  }
};

/* END OF JDZHOU IMPLEMENTATION */
