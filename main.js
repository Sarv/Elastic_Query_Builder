// main.js

//  queryType can be 'count', 'aggregation', or 'search'

// Valid inputs for fixedInterval:
// "s" (seconds), "m" (minutes), "h" (hours), "d" (days), "w" (weeks), "M" (months), "y" (years)
// Example: "1d" for one day, "2h" for two hours, "30m" for thirty minutes

// Valid inputs for size: positive integers

// Valid inputs for date values:
// 'YYYY-MM-DD HH:mm:ss.SSS' - specific date and time (e.g., "2024-03-13 12:00:00.432")
// "now" - current time
// "today" - today's date at start of day
// With offsets: "now-2m" (2 minutes ago), "today+1d" (tomorrow), "today-3h" (3 hours ago today)
// Note: "now" and "today" consider the `timeZone` value



const {createQuery } = require('./nestedQueryParser');

const input = 'profession.status = "active" and createDate >= "today-2d"' + // query string
              ' ; '+ // ';' is concatenated to seperate query string and options
              'queryType = "aggregation", '+   // options are separated by comma ','
              'aggregationType = "date_histogram", '+
              'aggregationField = "createDate", '+
              'timeZone = "+05:30", '+
              'fixed_interval = "1d", '+
              'size = 0, '+
              'interval = 20' +
              ''; 
              
const result = createQuery(input);


if (result.errorCode) {
  console.error(`Error Code: ${result.errorCode}`);
  console.error(`Message: ${result.message}`);
} else {
  console.log("Parsed JSON:");
  console.log(JSON.stringify(result.parsedJSON, null, 2));
  console.log("\nElasticsearch Query:");
  console.log(JSON.stringify(result.query, null, 2));
}


