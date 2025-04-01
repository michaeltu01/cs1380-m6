#!/usr/bin/env node

const {execSync} = require('child_process');
const fs = require('fs');

const NUM_QUERIES = 100;

const indexContent = fs.readFileSync('d/global-index.txt', 'utf-8');
const terms = indexContent
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => line.split('|')[0].trim());

console.log(`Running ${NUM_QUERIES} queries...`);

const start = process.hrtime.bigint();

for (let i = 0; i < NUM_QUERIES; i++) {
  const randomTerm = terms[Math.floor(Math.random() * terms.length)];
  execSync(`node query.js ${randomTerm}`, {stdio: 'ignore'});
}

const end = process.hrtime.bigint();
const duration = Number(end - start) / 1e9;

console.log(`\nResults:`);
console.log(`Total time: ${duration.toFixed(2)} seconds`);
console.log(`Throughput: ${(NUM_QUERIES / duration).toFixed(2)} queries/second`);
