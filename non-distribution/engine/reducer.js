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
