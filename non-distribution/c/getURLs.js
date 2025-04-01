#!/usr/bin/env node

/*
Extract all URLs from a web page.
Usage: ./getURLs.js <base_url>
*/

const readline = require('readline');
const {JSDOM} = require('jsdom');
// const {URL} = require('url');

/* JDZHOU IMPLEMENTATION */

// 1. Read the base URL from the command-line argument using `process.argv`.
let baseURL = process.argv[2];

if (baseURL.endsWith('index.html')) {
  baseURL = baseURL.slice(0, baseURL.length - 'index.html'.length);
} else {
  baseURL += '/';
}

const rl = readline.createInterface({
  input: process.stdin,
});

let html = '';
rl.on('line', (line) => {
  // 2. Read HTML input from standard input (stdin) line by line using the `readline` module.
  html += line;
});

rl.on('close', () => {
  // 3. Parse HTML using jsdom
  const jsdomObj = new JSDOM(html, {url: baseURL});

  // 4. Find all URLs:
  //  - select all anchor (`<a>`) elements) with an `href` attribute using `querySelectorAll`.
  //  - extract the value of the `href` attribute for each anchor element.
  const aElts = jsdomObj.window.document.querySelectorAll('a[href]');

  // 5. Print each absolute URL to the console, one per line.
  aElts.forEach((a, idx) => {
    if (a.href.startsWith('https://yummyrecipes.uk/'))
     {
      console.log(a.href);
     }
  });
});

/* END OF JDZHOU IMPLEMENTATION */


