// Define valid operators and field types for Elasticsearch queries
const validOperators = ['=', '!=', '>=', '<=', '>', '<', ':']; // * is for checking field exists or not. fieldName : "true" ...  fieldName : "false"
const fieldTypes = {
  keyword: ['=', '!=', ':'],
  text: ['=', '!=', ':'],
  long: ['>=', '<=', '=', '!=', '>', '<', ':'],
  integer: ['>=', '<=', '=', '!=', '>', '<', ':'],
  short: ['>=', '<=', '=', '!=', '>', '<', ':'],
  byte: ['>=', '<=', '=', '!=', '>', '<', ':'],
  double: ['>=', '<=', '=', '!=', '>', '<', ':'],
  float: ['>=', '<=', '=', '!=', '>', '<', ':'],
  half_float: ['>=', '<=', '=', '!=', '>', '<', ':'],
  scaled_float: ['>=', '<=', '=', '!=', '>', '<', ':'],
  date: ['>=', '<=', '=', '!=', '>', '<', ':'],
  boolean: ['=', '!=', ':']
};


// Define allowed field types for each aggregation type
const aggregationFieldTypeMapping = {
  avg: ['long', 'integer', 'short', 'byte', 'double', 'float', 'half_float', 'scaled_float'],
  sum: ['long', 'integer', 'short', 'byte', 'double', 'float', 'half_float', 'scaled_float'],
  min: ['long', 'integer', 'short', 'byte', 'double', 'float', 'half_float', 'scaled_float', 'date'],
  max: ['long', 'integer', 'short', 'byte', 'double', 'float', 'half_float', 'scaled_float', 'date'],
  stats: ['long', 'integer', 'short', 'byte', 'double', 'float', 'half_float', 'scaled_float'],
  extended_stats: ['long', 'integer', 'short', 'byte', 'double', 'float', 'half_float', 'scaled_float'],
  value_count: ['keyword', 'text', 'long', 'integer', 'short', 'byte', 'double', 'float', 'half_float', 'scaled_float', 'date', 'boolean'],
  percentiles: ['long', 'integer', 'short', 'byte', 'double', 'float', 'half_float', 'scaled_float'],
  //percentile_ranks: ['long', 'integer', 'short', 'byte', 'double', 'float', 'half_float', 'scaled_float'],
  cardinality: ['keyword', 'text', 'long', 'integer', 'short', 'byte', 'double', 'float', 'half_float', 'scaled_float', 'date', 'boolean'],
  terms: ['keyword', 'text', 'long', 'integer', 'short', 'byte', 'double', 'float', 'half_float', 'scaled_float', 'date', 'boolean'],
  //range: ['long', 'integer', 'short', 'byte', 'double', 'float', 'half_float', 'scaled_float', 'date'],
  //date_range: ['date'],
  //ip_range: ['ip'],
  histogram: ['long', 'integer', 'short', 'byte', 'double', 'float', 'half_float', 'scaled_float'],
  date_histogram: ['date'],
  //geo_distance: ['geo_point'],
  nested: ['nested'],
  //reverse_nested: ['nested'],
  //filters: ['keyword', 'text', 'long', 'integer', 'short', 'byte', 'double', 'float', 'half_float', 'scaled_float', 'date', 'boolean']
};

/**
 * Validates the fixed interval for date histogram aggregations.
 * Example of valid interval: '1d', '2h', '30m'.
 *
 * @param {string} interval - The fixed interval.
 * @returns {object|null} - An error object if validation fails, otherwise null.
 */
function validateFixedInterval(interval) {
  const intervalRegex = /^(\d+)([smhdwMy])$/;
  if (!intervalRegex.test(interval)) {
    return { errorCode: 'INVALID_FIXED_INTERVAL', message: 'fixed_interval format should be a number followed by s (seconds), m (minutes), h (hours), d (days), w (weeks), M (months), or y (years).' };
  }
  return null;
}

/**
 * Validates the size parameter for search queries.
 * Size must be a positive integer.
 *
 * @param {number} size - The size parameter.
 * @returns {object|null} - An error object if validation fails, otherwise null.
 */
function validateSize(size) {
  if (!Number.isInteger(size) || size < 0) {
    return { errorCode: 'INVALID_SIZE', message: 'Size must be a positive integer.' };
  }
  return null;
}


function validateHistoInterval(interval) {
  if (!Number.isInteger(interval) || interval <= 0) {
    return { errorCode: 'INVALID_INTERVAL', message: 'Interval must be a positive integer and greater than 0.' };
  }
  return null;
}

function validateOptions(input) {
  // Trim the input string to remove leading and trailing whitespace
  const trimmedInput = input.trim();

  // Define a pattern to match valid key=value pairs with spaces allowed around the equal sign
  const validPattern = /^([a-zA-Z0-9_-]+)\s*=\s*([a-zA-Z0-9_+\-.:>" ]+)$/;

  // Test the trimmed input against the pattern
  return validPattern.test(trimmedInput);
}

/**
 * Tokenizes the input query string into individual tokens.
 * Handles operators, logical gates, field names, and values.
 *
 * @param {string} input - The input query string.
 * @returns {Array} - An array of tokens.
 */
function tokenize(input) {
  const tokens = [];
  const regex = /(\w+(\.\w+)*|:|>=|<=|!=|=|>|<|and|or|\(|\)|"[^"]*"|\d+)/g;
  let match;

  while ((match = regex.exec(input)) !== null) {
    tokens.push(match[0]);
  }
  return tokens;
}

module.exports = {
  validOperators,
  fieldTypes,
  aggregationFieldTypeMapping,  // Export the mapping
  validateFixedInterval,
  validateSize,
  validateHistoInterval,
  tokenize,
  validateOptions
};
