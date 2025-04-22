// Created with the help of Claude 3.7 Sonnet LLM

const readline = require('readline');
const yargs = require('yargs');

// For chalk v5+, we need to use alternative coloring packages that still support CommonJS
const colors = require('ansi-colors'); // Alternative to chalk that works with CommonJS

// Parse command line arguments using yargs
const argv = yargs
  .option('ip', {
    alias: 'i',
    description: 'IP address of the remote node',
    type: 'string',
    demandOption: true
  })
  .option('port', {
    alias: 'p',
    description: 'Port of the remote node',
    type: 'number',
    demandOption: true
  })
  .help()
  .alias('help', 'h')
  .example('./search-cli.js --ip 127.0.0.1 --port 1234')
  .argv;

// Create remoteNodeConfig from command line arguments
const remoteNodeConfig = {
  ip: argv.ip,
  port: argv.port
};

// Import distribution system
const distribution = require('../../distribution.js');
const requireFunction = distribution.util.require;
// Create query service using the provided module
const queryService = require('./query.js').createQueryService(distribution, requireFunction);

// Create a simple spinner function
function createSpinner(text) {
  const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let frameIndex = 0;
  let intervalId;
  let spinnerText = text;
  
  return {
    start: () => {
      process.stdout.write('\x1B[?25l'); // Hide cursor
      intervalId = setInterval(() => {
        const frame = spinnerFrames[frameIndex = ++frameIndex % spinnerFrames.length];
        process.stdout.write(`\r${colors.blue(frame)} ${spinnerText}`);
      }, 80);
      return this;
    },
    stop: () => {
      clearInterval(intervalId);
      process.stdout.write('\r\x1B[K'); // Clear line
      process.stdout.write('\x1B[?25h'); // Show cursor
      return this;
    },
    setText: (text) => {
      spinnerText = text;
      return this;
    }
  };
}

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: colors.blue('🔍 Search > ')
});

// Function to search the distributed system using queryService
function searchDistributedSystem(query) {
  return new Promise((resolve, reject) => {
    queryService.searchIndex(query, remoteNodeConfig, (err, results) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(results);
    });
  });
}

// Function to display search results
function displayResults(results) {
  if (results.length === 0) {
    console.log(colors.yellow('No results found.'));
    return;
  }

  console.log(colors.green(`\nFound ${results.length} results:\n`));
  
  results.forEach((result) => {
    const resultContent = `➡️ ${colors.bold(result.url)}\n    ${colors.gray(`Relevance Score: ${result.score}`)}`;
    console.log(resultContent + '\n');
  });
}

// Start the CLI application
function startSearchCLI() {
  console.log(colors.bold.green('=== Interactive Search CLI ==='));
  console.log(colors.italic(`Connected to node at ${remoteNodeConfig.ip}:${remoteNodeConfig.port}`));
  console.log(colors.italic('Enter your search query or press Ctrl+C to exit.\n'));
  
  rl.prompt();

  // Handle user input
  rl.on('line', async (input) => {
    const query = input.trim();
    
    if (query) {
      // Display spinner while waiting for search results
      const spinner = createSpinner(`Searching for "${query}"...`);
      spinner.start();
      
      try {
        // Get search results from distributed system using queryService
        const results = await searchDistributedSystem(query);
        
        // Stop spinner and display results
        spinner.stop();
        displayResults(results);
      } catch (error) {
        spinner.stop();
        console.error(colors.red(`Error searching index: ${error.message}`));
      }
    }
    
    // Prompt for next query
    rl.prompt();
  });

  // Handle exit
  rl.on('close', () => {
    console.log(colors.bold('\nThank you for using the Search CLI. Goodbye!'));
    process.exit(0);
  });
}

// Start the CLI
startSearchCLI();