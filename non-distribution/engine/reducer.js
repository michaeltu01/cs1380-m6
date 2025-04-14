/* REDUCER */

function reducerFunction(key, values) {
    if (!values || values.length === 0) {
        console.log(key, values);
        return;  // NOTE: Need to return null for the reduce result to not show up in the final reduceResults
    }
    // input: ngram, list of [url, 1]
    // output: <ngram, sorted results of [url, cnt]>

    // url -> count
    const urlCnts = {};
    for (const urlPair of values) {
        // console.log(urlPair)
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
    // console.log(key);
    // console.log(entries);
    return out;
}

module.exports = reducerFunction;
