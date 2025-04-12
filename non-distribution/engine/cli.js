const distribution = require('../../distribution');
const requireFunction = distribution.util.require;
const prompt = require('prompt-sync')();
const queryService = require('./query.js').createQueryService(distribution, requireFunction);

console.log('🔍 Welcome to the Recipe Search CLI!');

while (true) {
  const query = prompt('\nEnter a recipe keyword to search (or type "exit" to quit): ').toLowerCase();
  if (query === 'exit' || query === 'e' || query === 'E' || query === 'Exit') {
    console.log('👋 Goodbye!');
    break;
  }

  queryService.searchIndex(query, (err, sortedResults) => {
    if (err) {
        console.log('❌ Error found in searching.');
    }

      if (sortedResults.length > 0) {
        console.log('\n🍽️ Recipes found:');
        sortedResults.forEach(r => {
          console.log(`${r.url}`);
        });
      } else {
        console.log('❌ No recipes found.');
      }
      });
}
