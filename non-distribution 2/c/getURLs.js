#!/usr/bin/env node

/*
Extract all URLs from a web page.
Usage: ./getURLs.js <base_url>
*/

const readline = require('readline');
const {JSDOM} = require('jsdom');
const {URL} = require('url');

// 1. Read the base URL from the command-line argument using `process.argv`.
let baseURL = '';
if (process.argv.length > 2) {
  baseURL = process.argv[2];
}

if (baseURL.endsWith('index.html')) {
  baseURL = baseURL.slice(0, baseURL.length - 'index.html'.length);
} else {
  baseURL += '/';
}

const rl = readline.createInterface({
  input: process.stdin,
});

const allLines = [];
rl.on('line', (line) => {
  // 2. Read HTML input from standard input (stdin) line by line using the `readline` module.
  allLines.push(line);
});

rl.on('close', () => {
  // 3. Parse HTML using jsdom
  const dom = new JSDOM(allLines.join('\n'));
  const document = dom.window.document;

  // 4. Find all URLs:
  //  - select all anchor (`<a>`) elements) with an `href` attribute using `querySelectorAll`.
  //  - extract the value of the `href` attribute for each anchor element.
  const urls = [];
  document.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (href.startsWith('https://www.101cookbooks.com')) {
      urls.push(href);
    }
    // } else {
    //   urls.push(new URL(href, baseURL).href);
    // }
  });
  // 5. Print each absolute URL to the console, one per line.
  urls.forEach((url) => {
    console.log(url);
  });
});
