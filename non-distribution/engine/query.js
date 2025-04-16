function createQueryService(distribution, require) {
    const natural = require('natural');
    const fs = require('fs');

    // returns a string
    function processQuery(queryString) {
        // console.log('Processing query:', queryString);
        const WHITELIST_PATH = 'non-distribution/engine/whitelist.txt';
        let whitelist = [];
        try {
            const data = fs.readFileSync(WHITELIST_PATH, {encoding: 'utf8', flag: 'r'}).toString();
            whitelist = data.split('\n');
        } catch (err) {
            console.error('Error reading whitelist.txt:', err);
            return;
        }

        const nonAlphabeticRegex = /[^a-zA-z\n]/g;
        const notAsciiRegex = /[^\x00-\x7F]/g;
        const stemmer = natural.PorterStemmer;

        let processedQuery = queryString.toLowerCase()
            .replaceAll(nonAlphabeticRegex, '')
            .replaceAll(notAsciiRegex, '')
            .split(' ')
            .filter((word) => (whitelist.includes(word)))
            .filter((word) => word !== "")
            .map((word) => stemmer.stem(word))
            .join(' ');
        
        return processedQuery;
    }

    function searchIndex(queryString, remoteNodeConfig, callback) {
        const processedQuery = processQuery(queryString);
        console.log('Processed query:', processedQuery);
        
        // NOTE: this needs to run on the same node as orchestrator
        // can do a comm.send on the orchestrator node if we want to run separately
        // distribution.local.store.get(null, (err, keys) => {
        const remote = {
            node: remoteNodeConfig,
            gid: 'local',
            service: 'store',
            method: 'get',
        };
        distribution.local.comm.send([null], remote, (err, keys) => {
            if (err) {
                return callback(err);
            }
            
            // TODO: come back to this -- do we want to use exact matching or do we want to do something else?
            const relevantKeys = keys.filter(key => key.includes(processedQuery));
            if (relevantKeys.length === 0) {
                return callback(null, []);
            }

            const results = {};
            let keysProcessed = 0;

            // console.log('Relevant keys:', relevantKeys);

            relevantKeys.forEach(key => {
                distribution.local.store.get(key, (err, urlFreqPairs) => {
                    if (!err && urlFreqPairs) {
                        for (const [url, score] of urlFreqPairs) {
                            if (!results[url]) results[url] = 0;
                            results[url] += score;
                        }
                    }
                    keysProcessed++;

                    if (keysProcessed === relevantKeys.length) {
                        const sortedResults = Object.entries(results)
                            .sort((a, b) => b[1] - a[1])
                            .map(([url, score]) => ({ url, score }));
                        
                        callback(null, sortedResults);
                    }
                });
            });
        });
    }
    
    return {
        searchIndex
    };
}

module.exports = { createQueryService };