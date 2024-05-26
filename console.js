const readline = require('readline');
const { createQuery } = require('./nestedQueryParser');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => {
  return new Promise((resolve) => rl.question(query, resolve));
};

const processInput = async () => {
  console.log("Press 'quit' to exit at any time.\n");

  while (true) {
    const queryString = await askQuestion('\nEnter your query string: ');
    if (queryString.trim().toLowerCase() === 'quit') break;

    
    try {
      const result = createQuery(queryString);


      if (result.errorCode) {
        console.error(`Error Code: ${result.errorCode}`);
        console.error(`Message: ${result.message}`);
      } else {
        console.log("Parsed JSON:");
        console.log(JSON.stringify(result.parsedJSON, null, 2));
        console.log("\nElasticsearch Query:");
        console.log(JSON.stringify(result.query, null, 2));
        console.log("-----------------------------");
      }

      
    } catch (error) {
      console.error('Error processing input:', error.message);
    }
  }

  rl.close();
};

processInput();
