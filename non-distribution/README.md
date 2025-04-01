# M0: Setup & Centralized Computing

> Add your contact information below and in `package.json`.

* name: Jonathan Zhou

* email: jonathan_zhou@brown.edu

* cslogin: jdzhou


## Summary


My implementation consists of 6 components addressing T1--8.  The most challenging aspect of this milestone was testing because all the tests I wrote were in bash script, which I had not worked with before, so it was difficult to learn the syntax. Also, working with relative and absolute file paths together was very frustrating at times.


## Correctness & Performance Characterization

*Correctness*:
To characterize correctness, I developed 8 tests that test the following cases: general functionality for the smaller components that just use libraries, and more edge cases for the larger components like query.js. For query.js, I tested terms that did not exist in the index, terms that did exist in the index, multi-word term matches, and tried querying terms that did not exist in the index, but were part of words that did exist in the index (ex: plant vs plantation). I wrote at least one test for all of the components I developed, and for each component, I also wrote a custom data file to test the component with in the ts/d directory.


*Performance*: 
To measure throughput of my system both locally and on the AWS node, I decided to use the time command to run each subsystem (crawler, indexer, and query) on the same corpora (https://cs.brown.edu/courses/csci1380/sandbox/4/), I would time how long each program would take to run on the corpora and I would count the number of links the subsystem operated on, and then I would divide the number of URLs processed by the time taken in seconds to get the throughput for the components. I wrote a script in ts called s_throughput.sh that would just loop 20 times and run a subsystem in order to get these measurements.

Doing this, I found that locally, crawl.sh processed 20 URLs in 3 minutes and 37 seconds, equating to a throughput of 0.092 URLs per second; index.sh processed 20 pages in 1 minutes and 7 seconds, giving a 0.299 URLs/sec throughput; query.js processed 20 queries in 1 minute and 8 seconds, which means that its throughput is 0.294 queries per second.

On the AWS EC2 instance, I ran the same experiments and found that crawling 20 URLs took 29.69 seconds, indexing 20 pages took 22.129 seconds, and querying 20 times took 1 minute and 58 seconds, giving throughputs of 0.674 URLs/sec, 0.904 URLs/sec, and 0.169 queries/sec respectively. I was confused by why the throughput was so much slower relatively for querying on AWS, and I think it was because of the term 'tag' I used for the query term. The bottleneck became the time it takes to print to stdout, not the actual processing. When I tried a term that didn't exist for query, it only took 18.7 seconds to run 20 queries, or a throughput of 1.07 queries/sec.


## Wild Guess

I estimated that building the fully distributed, scalable version of this search engine would take around 2000 lines of code, or a little more than 5x the amount of code that I wrote for this non-distributed search engine. I think it would take this amount because there would be significant more overhead code in splitting the tasks amongst nodes, message passing between nodes and servers to process the data, and test each additional distributed component of the system.