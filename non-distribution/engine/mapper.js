/* MAPPER */
const {convert} = require('html-to-text');
const fs = require('fs');
const natural = require('natural');

function mapperFunction(key, value) {
    // key is URL, <nothing -- unicorns>
    
    // fetch the page content
    fetch(key, {method: "GET"}).then(response => {
        //extract text from HTML
        response.text().then(html => {
            // convert the html to text
            text = convert(html, {wordwrap: 130});

            // Process the text to make each word on a newline, remove stopwords, lowercase, etc.
            
            // RegEx's
            // https://www.regular-expressions.info/posixbrackets.html
            const newLineRegex = /[\p{P} ]/gu;
            const nonAlphabeticRegex = /[^a-zA-z\n]/g;
            const notAsciiRegex = /[^\x00-\x7F]/g;

            // Read in the stopword corpora
            const STOPWORDS_PATH = '../non-distribution/d/stopwords.txt';
            let stopwords = '';
            try {
                const data = fs.readFileSync(STOPWORDS_PATH, {encoding: 'utf8', flag: 'r'}).toString();
                stopwords = data.split('\n');
            } catch (err) {
                console.err('Error reading stopwords.txt:', err);
                return;
            }

            text.replaceAll(newLineRegex, '\n')
                .replaceAll(nonAlphabeticRegex, '')
                .toLowerCase()
                .replaceAll(notAsciiRegex, '')
                .split('\n')
                .filter((word) => word in stopwords)
                .join('\n');


            // After processing all the text, then stem everything
            const stemmer = natural.PorterStemmer;
            stemmedText = stemmer.stem(text);
            
            // Split stemmed text into array --> Combine this array
            ngrams = generateNgrams(stemmedText.split('\n'));
            results = [];
            for (const gram in ngrams) {
                const out = {};
                out[gram] = [key, 1];
                results.push(out);
            }
            return results;
        });
    })
}

// Combine
// Input: terms is an array of words
function generateNgrams(terms) {
    let grams = [];
    const n = terms.length;
    for (let i = 0; i < n - 1; i++) {
        const bi = terms[i] + " " + terms[i + 1];
        grams.append(bi);
    }
    for (let i = 0; i < n - 2; i++) {
        const tri = terms[i] + " " + terms[i + 1] + " " + terms[i + 2];
        grams.append(tri);
    }
    
    return grams;
}

/* REDUCER */

function reducerFunction(key, values) {
    // input: ngram, list of [url, 1]
    // output: <ngram, sorted results of [url, cnt]>
    
    // url -> count
    const urlCnts = {};
    for (const urlPair in values) {
        const url = urlPair[0];
        if (url in urlCnts) {
            urlCnts[url]++;
        }
        else urlCnts[url] = 1;
    }

    // sort [url, cnt] pairs by hitcount
    const entries = Object.entries(urlCnts);
    entries.sort((a, b) => b[1] - a[1]);

    const out = {};
    out[key] = entries;
    return out;
}

module.exports = {
    mapperFunction,
    reducerFunction
}