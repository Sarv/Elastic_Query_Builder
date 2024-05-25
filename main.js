// main.js

const { tokenize, parseQuery, jsonToESQuery, isAggregationAllowed } = require('./nestedQueryParser');

const input = 'profession.status = "active" and createDate >= "today-2d"';
// const input = 'profession.joiningDate >= "now-20d" and gender = "male"';
const queryType = 'aggregation'; // Can be 'count', 'aggregation', or 'search'
const aggregationType = 'date_histogram'; // Example aggregation type
const aggregationField = 'createDate'; // Example field name
const timeZone = '+05:30'; // Example time zone

// Valid inputs for fixedInterval:
// "s" (seconds), "m" (minutes), "h" (hours), "d" (days), "w" (weeks), "M" (months), "y" (years)
// Example: "1d" for one day, "2h" for two hours, "30m" for thirty minutes
const fixedInterval = '1d'; // Example fixed interval

// Valid inputs for size: positive integers
const size = 10; // Example size

// Valid inputs for date values:
// 'YYYY-MM-DD HH:mm:ss.SSS' - specific date and time (e.g., "2024-03-13 12:00:00.432")
// "now" - current time
// "today" - today's date at start of day
// With offsets: "now-2m" (2 minutes ago), "today+1d" (tomorrow), "today-3h" (3 hours ago today)
// Note: "now" and "today" consider the `timeZone` value
const tokens = tokenize(input);
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
