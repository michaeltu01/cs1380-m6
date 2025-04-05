let mapper = require("../mapper");
let reducer = require("../reducer");

test('mapper on sandbox website',  async () => {
    let url = 'https://cs.brown.edu/courses/csci1380/sandbox/1/';
    
    // Use await here to properly wait for the Promise to resolve
    const result = await mapper(url, null);
    console.log(result);
});