/* MAPPER */

async function mapperFunction(key, value, require) {
    const {convert} = require('html-to-text');
    const fs = require('fs');
    const natural = require('natural');
    const https = require('https');
    // key is URL, <nothing -- unicorns>
    try {
        // fetch the page content
        // const response = await fetch(key, { method: "GET" });
        const html = await new Promise((resolve, reject) => {
            const options = {
                rejectUnauthorized: false // This will ignore SSL certificate issues
            };

            https.get(key, options, (res) => {
                let data = '';
                
                // A chunk of data has been received
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                // The whole response has been received
                res.on('end', () => {
                    resolve(data);
                });
            }).on('error', (err) => {
                reject(err);
            });
        });
        // const html = await response.text();
        // console.log(html);
        let text = convert(html, {wordwrap: 130});

        // Process the text to make each word on a newline, remove stopwords, lowercase, etc.
        
        // RegEx's
        // https://www.regular-expressions.info/posixbrackets.html
        const newLineRegex = /[\p{P} ]/gu;
        const nonAlphabeticRegex = /[^a-zA-z\n]/g;
        const notAsciiRegex = /[^\x00-\x7F]/g;

        // Read in the stopword corpora
        const STOPWORDS_PATH = 'non-distribution/d/stopwords.txt';
        let stopwords = [];
        try {
            const data = fs.readFileSync(STOPWORDS_PATH, {encoding: 'utf8', flag: 'r'}).toString();
            stopwords = data.split('\n');
        } catch (err) {
            console.error('Error reading stopwords.txt:', err);
            return;
        }
        const stemmer = natural.PorterStemmer;

        text = text.replaceAll(newLineRegex, '\n')
            .replaceAll(nonAlphabeticRegex, '')
            .toLowerCase()
            .replaceAll(notAsciiRegex, '')
            .split('\n')
            .filter((word) => !(stopwords.includes(word)))
            .filter((word) => word !== "")
            .map((word) => stemmer.stem(word))
            .join('\n');
        console.log(text);
        // After processing all the text, then stem everything
        // stemmedText = stemmer.stem(text.split('\n')).join('\n');
        
        // Split stemmed text into array --> Combine this array
        terms = text.split('\n');
        let grams = {};
        const n = terms.length;
        for (let i = 0; i < n - 1; i++) {
            const bi = terms[i] + " " + terms[i + 1];
            if (bi in grams) {
                grams[bi]++;
            }
            else grams[bi] = 1;
        }
        for (let i = 0; i < n - 2; i++) {
            const tri = terms[i] + " " + terms[i + 1] + " " + terms[i + 2];
            if (tri in grams) {
                grams[tri]++;
            }
            else grams[tri] = 1;    
        }
    
        ngrams = Object.entries(grams);
        results = [];
        for (const gram of ngrams) {
            const out = {};
            out[gram[0]] = [[key, gram[1]]];
            results.push(out);
        }
        return results;
    }
    catch (err) {
        console.error('Error in mapper function', err);
        return [];
    }
}

module.exports = mapperFunction;
