const readline = require('readline');
const { tokenize, parseQuery, jsonToESQuery, isAggregationAllowed } = require('./nestedQueryParser');

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

    const queryType = await askQuestion('Enter query type (search, count, aggregation): ');
    if (queryType.trim().toLowerCase() === 'quit') break;

    let aggregationType = null;
    let aggregationField = null;
    let fixedInterval = '1d';
    let size = 10;

    if (queryType === 'aggregation') {
      aggregationType = await askQuestion('Enter aggregation type: ');
      if (aggregationType.trim().toLowerCase() === 'quit') break;

      aggregationField = await askQuestion('Enter aggregation field: ');
      if (aggregationField.trim().toLowerCase() === 'quit') break;

      fixedInterval = await askQuestion('Enter fixed interval (default 1d): ');
      if (fixedInterval.trim().toLowerCase() === 'quit') break;
      fixedInterval = fixedInterval || '1d';
    }

    const timeZone = await askQuestion('Enter timezone (default Z): ');
    if (timeZone.trim().toLowerCase() === 'quit') break;

    if (queryType === 'search') {
      size = await askQuestion('Enter size (default 10): ');
      if (size.trim().toLowerCase() === 'quit') break;
      size = parseInt(size) || 10;
    }

    try {
      const tokens = tokenize(queryString);
      const parsedJSON = parseQuery(tokens, timeZone);

      if (parsedJSON.errorCode) {
        console.error(`Error Code: ${parsedJSON.errorCode}`);
        console.error(`Message: ${parsedJSON.message}`);
      } else {
        console.log("Parsed JSON:");
        console.log(JSON.stringify(parsedJSON, null, 2));

        const esQuery = jsonToESQuery(parsedJSON, queryType, aggregationType, aggregationField, fixedInterval, size);

        if (esQuery.error) {
          console.error(`Error Code: ${esQuery.error}`);
          console.error(`Message: ${esQuery.message}`);
        } else {
          console.log("Elasticsearch Query:");
          console.log(JSON.stringify(esQuery, null, 2));
        }
      }
    } catch (error) {
      console.error('Error processing input:', error.message);
    }
  }

  rl.close();
};

processInput();
