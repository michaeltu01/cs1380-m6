## Summarize the process of writing the paper and preparing the poster, including any surprises you encountered.
We started by combining components to make a best-of-breed implementation. This ended up being quite easy since we were able to use components from just one team member's implementation. 
Discussion shifted after that to the task we wanted our search engine to do. We started with the research paper idea suggested in the handout, but found some formatting issues with the URLs
and paper content. So, we switched to recipes. We were surprised when we started crawling a recipe site only to get an error that we needed to enable JavaScript. After some digging, we discovered
that we'd need to crawl a static recipe site. Once we found an appropriate base URL (thank you, Simply Recipes), we could move on.

This allowed us to start the poster early to receive feedback. After that, we started by designing the architecture of the system, beginning with the indexing subsystem. We knew that we wanted 
to make the indexer distributed, but we didn't immediately think of map-reduce. After talking about it more, we landed upon the map-reduce solution and built towards that. Then we turned to the 
query subsystem -- we wondered about the different issues that could arise from a distributed query system, like race conditions in the global index and handling sharding. For simplicity, we 
kept querying on our orchestrator node (the node handling the MR call for indexing). Finally, we built out a simple CLI for interacting with the search engine.

## Roughly, how many hours did M6 take you to complete?
Hours: 20
## How many LoC did the distributed version of the project end up taking?
DLoC: 1200 (just new files)
## How does this number compare with your non-distributed version?
LoC: 600
## How different are these numbers for different members in the team and why?
Team members' predictions: 1750, 600, 800, 1100
The numbers were pretty similar across team members, but we generally underestimated. Two team members were much closer due to some prior experience with larger distributed systems. 
