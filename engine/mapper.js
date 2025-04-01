function mapperFunction(key, value) {
    // key is URL, value is page content

    // getText.js
    const text = extractText(value);

    // process.sh
    const terms = processText(text);

    // combine.sh
    const ngrams = generateNgrams(terms);

    const results = [];
    const termCounts = countTerms(ngrams);

    for (const [term, count] of Object.entries(termCounts)) {
        const result = {};
        result[term] = {url: key, frequency: count};
        results.push(result);
    }

    return results;
}

function reducerFunction(key, values) {
    values.sort((a, b) => b.frequency - a.frequency);
    
    const urlFreqPairs = values.map(v => `${v.url} ${v.frequency}`).join(' ');
    
    const result = {};
    result[key] = urlFreqPairs;
    return result;
  }