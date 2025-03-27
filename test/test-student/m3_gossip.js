const testGossipConvergence = (networkSize, subsetFuncs, iterations = 10) => {
    const results = {};
    
    for (const [name, func] of Object.entries(subsetFuncs)) {
      const convergenceTimes = [];
      
      for (let i = 0; i < iterations; i++) {
        const nodes = new Set();
        const informed = new Set();
        for (let j = 0; j < networkSize; j++) {
          nodes.add(j);
        }
        
        informed.add(0);
        let rounds = 0;
        
        while (informed.size < nodes.size) {
          rounds++;
          const newInformed = new Set();
          
          for (const node of informed) {
            const subset = func(Array.from(nodes));
            const selected = new Set();
            while (selected.size < subset) {
              const idx = Math.floor(Math.random() * nodes.size);
              selected.add(idx);
            }
            for (const target of selected) {
              newInformed.add(target);
            }
          }
          
          for (const node of newInformed) {
            informed.add(node);
          }
        }
        
        convergenceTimes.push(rounds);
      }
      
      results[name] = {
        mean: convergenceTimes.reduce((a,b) => a + b, 0) / iterations,
      };
    }
    
    return results;
  };
  
  const subsetFuncs = {
    'log(n)': (lst) => Math.ceil(Math.log(lst.length)),
    'sqrt(n)': (lst) => Math.ceil(Math.sqrt(lst.length)),
    'constant3': (lst) => 3,
    'constant5': (lst) => 5
  };
  
  const sizes = [10, 50, 100, 500, 1000, 10000];
  const allResults = {};
  
  for (const size of sizes) {
    const result = testGossipConvergence(size, subsetFuncs);
    allResults[size] = result;
  }
  
  console.log('All results:', allResults);