# M0: Setup & Centralized Computing
> Add your contact information below and in `package.json`.
* name: `Joseph Dodson`
* email: `joseph_dodson@brown.edu`
* cslogin: `jdodson4`
## Summary
My implementation consists of 8 components addressing T1--8. The most challenging aspect was measuring throughput because there wasn't a stencil, which required me to come up with the design. At first, I used promises in JavaScript, which I had to learn more about that to complete the throughput measurement. However, this caused the linter to fail, so I decided to switch to shell. Since I'm not experienced with shell, I had to learn how to time operations and loop over the URLs. Measuring query throughput was easier than measuring crawler & indexer throughput since I just ran a set number of queries and did not need to interact with files (other than global-index, from which I picked the query terms)

The 7 components are: 
- stem.js
- getText.js
- getURLs.js
- process.sh
- merge.js
- query.js
- 8 tests
- throughput measurement

I didn't complete any of the lab work or extra credit. The JavaScript components and the shell component were completed by reading the handout, looking at the tests, and using the provided stencils. The tests were based off of the given tests, but with new data.
## Correctness & Performance Characterization
To characterize correctness, we developed 8 that test the following cases: stem, getText, getURLs, process, merge, query, invert, and one end-to-end test. I used the provided tests as a stencil, but with new data files. For example,for stemming, I used a file that had more than one word per line -- this made me realize I had a bug (I was stemming each line, not the words). For getText and getURLs, I used a larger HTML document. For merge, I used the example given in the comment within the code stencil. At first, this test failed, even though the provided test succeeded, due to an issue in my handling of the global index (I was popping the first line, causing the merge to miss some data). 

*Performance*: The throughput of various subsystems is described in the `"throughput"` portion of package.json. The characteristics of my development machines are summarized in the `"dev"` portion of package.json. The metrics are listed in order of crawler, indexer, and query throughput, in operations per second.

Throughput was tested by using sandbox 1. This provided enough URLs for the crawler and indexer without taking too much time. Testing with a larger corpus, like sandbox 2, resulted in similar results but a much longer test time. For each URL on the page, the crawler is called, and the time taken to download the page is added to a total crawl time tracker. Then, the indexer is called on that page's content, with the time added to a separate total index time tracker. At the end, the crawl time and index time are divided by the total number of URLs/pages crawled & indexed to get the number of operations per second. For the query throughput measurement, 100 queries are run using randomly selected n-grams from the global index. The total time taken is divided by 100 to get the number of queries per second. 

The metrics (also in package.json) are:
"dev": [1.98, 3.48, 3.75],
"aws": [0.80, 0.99, 1.09],

I was surprised at how much slower the AWS deployment was. However, given that I used a micro instance, I'm sure there were many fewer cores and much less processing power of the EC2 instance as compared to my computer. It would also make sense for the crawler to take longer, since AWS probably throttles network activity for EC2 instances, especially on the free tier.
## Wild Guess
For the fully distributed version, I guess around 3000 lines of code. Given that the non-distributed version took around 300 lines of code, we know that the distributed version will use more than that. While the core logic will be similar, there will be lots of new pieces for managing the distribution, ensuring consistency, and running in a distributed fashion. At a minimum, I expect this to take 1500 lines, but with tests and performance measurements included, I estimate around 3000 lines of code.