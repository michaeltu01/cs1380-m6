#!/bin/bash

# Performance testing script to measure crawler and indexer throughput

# Initialize files
true > d/visited.txt
true > d/urls.txt
true > d/content.txt

# Initialize counters
urls_crawled=0
pages_indexed=0
total_crawl_time=0
total_index_time=0

# Start with seed URL
seed_url="https://cs.brown.edu/courses/csci1380/sandbox/1"
echo "$seed_url" >> d/urls.txt

# Process URLs until no more unvisited ones
while true; do
  # Get next unvisited URL
  next_url=$(comm -23 <(sort d/urls.txt) <(sort d/visited.txt) | head -n 1)
  
  if [ -z "$next_url" ]; then
    break
  fi
  
  echo "Crawling URL: $next_url"
  
  # Measure crawler
  crawl_start=$SECONDS
  ./crawl.sh "$next_url" > d/content.txt
  crawl_duration=$((SECONDS - crawl_start))
  total_crawl_time=$((total_crawl_time + crawl_duration))
  ((urls_crawled++))
  
  echo "Indexing URL: $next_url"
  
  # Measure indexer
  index_start=$SECONDS
  ./index.sh d/content.txt "$next_url"
  index_duration=$((SECONDS - index_start))
  total_index_time=$((total_index_time + index_duration))
  ((pages_indexed++))
done

# Print results
echo -e "\nPerformance Test Results:"
echo "------------------------"

echo -e "\nCrawler:"
echo "URLs crawled: $urls_crawled"
echo "Total time: $total_crawl_time seconds"
crawl_throughput=$((urls_crawled / total_crawl_time))
echo "Throughput: $crawl_throughput URLs/second"

echo -e "\nIndexer:"
echo "Pages indexed: $pages_indexed"
echo "Total time: $total_index_time seconds"
index_throughput=$((pages_indexed / total_index_time))
echo "Throughput: $index_throughput pages/second"