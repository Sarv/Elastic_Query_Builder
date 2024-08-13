const { parseRelativeDate, formatDateString, validateTimeZone } = require('./utils/dateUtils');
const { validOperators, fieldTypes, validateFixedInterval, validateSize,validateHistoInterval,  tokenize, aggregationFieldTypeMapping, validateOptions } = require('./utils/queryUtils');
const { loadMapping } = require('./utils/mappingUtils');

// Load the fields and indexed fields from the mapping
let fields = {};
let indexedFields = {};

const { allFields, indexedFields: indexed } = loadMapping();
fields = allFields;
indexedFields = indexed;

/**
 * Parses the tokenized query string into an expression tree.
 * Handles logical gates and nested expressions.
 *
 * @param {Array} tokens - The tokenized query string.
 * @param {string} timeZone - The time zone offset (e.g., "+05:30").
 * @returns {object} - The parsed expression tree.
 */
function parseQuery(tokens, timeZone = 'Z') {
  const logicalGates = ['and', 'or', 'AND', 'OR'];

  const timeZoneValidate = validateTimeZone(timeZone);
          if (timeZoneValidate.errorCode) {
            return timeZoneValidate; // Return error if timeZone is invalid
          }

  /**
   * Recursively parses the tokens into a nested expression tree.
   * 
   * @param {Array} tokens - The tokenized query string.
   * @param {string} parentLogicGate - The logical gate used in the parent expression.
   * @returns {object} - The parsed nested expression or an error object.
   */
  function parseExpression(tokens, parentLogicGate = 'and') {

    const expression = { conditions: [], logicGate: parentLogicGate };
    let currentKey = null;
    let currentOperator = null;
    let currentValue = null;

    while (tokens.length > 0) {
      const token = tokens.shift();

      if (logicalGates.includes(token)) {
        expression.logicGate = token; // Set the logic gate for the current expression
      } else if (token === '(') {
        const nestedExpression = parseExpression(tokens);
        if (nestedExpression.errorCode) {
          return nestedExpression; // Return error if any from nested expression
        }
        expression.conditions.push(nestedExpression);
      } else if (token === ')') {
        return expression; // End of the current nested expression
      } else if (fields[token]) {
        currentKey = token; // Set the current field key
      } else if (validOperators.includes(token)) {
        if (!currentKey) {
          return { errorCode: 'MISSING_FIELD', message: `Field is missing before operator ${token}.` };
        }
        currentOperator = token; // Set the current operator
      } else {
        if (!currentKey) {
          return { errorCode: 'INVALID_FIELD', message: `Invalid field ${token} found.` };
        }
        if (!currentOperator) {
          return { errorCode: 'INVALID_OPERATOR', message: 'Invalid operator found.' };
        }
        currentValue = token.replace(/"/g, ''); // Set the current value
        const fieldType = fields[currentKey];
        const isIndexed = indexedFields[currentKey];

        // Check if the field type is defined
        if (!fieldType) {
          return { errorCode: 'FIELD_TYPE_NOT_DEFINED', message: `Field type for ${currentKey} is not defined.` };
        }

        // Check if the field is indexed
        if (!isIndexed) {
          return { errorCode: 'FIELD_NOT_INDEXED', message: `Field ${currentKey} is present but not indexed.` };
        }

        // Check if the operator is valid
        if (!validOperators.includes(currentOperator)) {
          return { errorCode: 'INVALID_OPERATOR', message: 'Invalid operator found.' };
        }

        // Check if the field type is valid
        if (!fieldTypes[fieldType]) {
          return { errorCode: 'INVALID_FIELD_TYPE', message: `Invalid field type ${fieldType} for field ${currentKey}.` };
        }

        // Split the value by '/' if it contains multiple options // 14 aug 2024 // Abhimanyu Sharma
        // Validate if '/' is used with valid operators only
        if (currentValue.includes('/')) {
            if (currentOperator !== '=' && currentOperator !== '!=') {
                return { errorCode: 'INVALID_OPERATOR_FOR_VALUE', message: `Operator ${currentOperator} is not allowed with values containing '/' for field ${currentKey}.` };
            }
            currentValue = currentValue.split('/').map(val => val.trim()); // Split the value by '/'
        }

        // Format the date value if the field type is date
        if (fieldType === 'date') {
          const formattedDate = formatDateString(currentValue, timeZone);
          if (formattedDate.errorCode) {
            return formattedDate; // Return error if date format is invalid
          }
          currentValue = formattedDate;
        }

        // Check if the operator is allowed for the field type
        if (fieldTypes[fieldType].includes(currentOperator)) {
          const condition = {
            field: currentKey,
            operator: currentOperator,
            value: fieldType === 'number' ? parseFloat(currentValue) : currentValue
          };
          expression.conditions.push(condition); // Add the condition to the expression
        } else {
          return { errorCode: 'OPERATOR_NOT_ALLOWED', message: `Operator ${currentOperator} is not allowed for field type ${fieldType}.` };
        }

        // Reset the current key, operator, and value for the next iteration
        currentKey = null;
        currentOperator = null;
        currentValue = null;
      }
    }

    return expression;
  }

  // Start parsing from the root expression
  const parsedExpression = parseExpression(tokens);
  if (parsedExpression.errorCode) {
    return parsedExpression; // Return error if any from the root expression
  }
  return parsedExpression;
}

/**
 * Converts the parsed query JSON to an Elasticsearch query.
 * Handles conditions, aggregations, and options such as size and timeZone.
 *
 * @param {object} parsedQuery - The parsed query JSON structure.
 * @param {object} options - Query options including queryType, aggregationType, aggregationField, fixed_interval, size, and timeZone, interval, etc.
 * @returns {object} - The Elasticsearch query object.
 */

function jsonToESQuery(parsedJSON, options) {
  const queryType = ('queryType' in options ) ? options['queryType'] : "search";
  const aggregationType = ('aggregationType' in options ) ? options['aggregationType'] : null;
  const aggregationField = ('aggregationField' in options ) ? options['aggregationField'] : null;
  const fixedInterval = ('fixed_interval' in options ) ? options['fixed_interval'] : "1d";
  const size = ('size' in options ) ? parseInt(options['size'],10) : 10;
  const histo_interval = ('interval' in options ) ? parseInt(options['interval'],10) : 10;


  // Check if there is an error in the parsed JSON
  if (parsedJSON.errorCode) {
    return parsedJSON;
  }

  // Validate the fixed interval for date histogram
  const intervalError = validateFixedInterval(fixedInterval);
  if (intervalError) {
    return intervalError;
  }

  // Validate the size parameter for search queries
  const sizeError = validateSize(size);
  if (sizeError) {
    return sizeError;
  }

  // Validate the histo_interval parameter
  const histo_intervalError = validateHistoInterval(histo_interval);
  if (histo_intervalError) {
    return histo_intervalError;
  }

  /**
   * Recursively builds the Elasticsearch query from the parsed conditions.
   *
   * @param {object} condition - The condition to build the query for.
   * @returns {object} - The Elasticsearch query object for the given condition.
   */
  function buildQuery(condition) {
    if (condition.conditions) {
      const subQueries = condition.conditions.map(buildQuery);
      if (condition.logicGate === 'and' || condition.logicGate === 'AND') {
        return { bool: { must: subQueries } };
      } else if (condition.logicGate === 'or' || condition.logicGate === 'OR') {
        return { bool: { should: subQueries } };
      }
    } else {
      const pathParts = condition.field.split('.');
      if (pathParts.length > 1) {
        const nestedPath = pathParts.slice(0, -1).join('.');
        const fieldName = pathParts[pathParts.length - 1];
        const fieldType = fields[condition.field];

        if (fieldType === 'keyword' || fieldType === 'text') {
          if (condition.operator === '!=') {
            return {
              nested: {
                path: nestedPath,
                query: {
                  bool: {
                    must_not: [{
                      terms: { [condition.field]: { value: condition.value } }
                    }]
                  }
                }
              }
            };
          } else {
            return {
              nested: {
                path: nestedPath,
                query: {
                  bool: {
                    must: [{
                      terms: { [condition.field]: { value: condition.value } }
                    }]
                  }
                }
              }
            };
          }
        } else if (fieldType === 'date' || fieldType === 'long' || fieldType === 'integer' || fieldType === 'short' || fieldType === 'byte' || fieldType === 'double' || fieldType === 'float' || fieldType === 'half_float' || fieldType === 'scaled_float') {
          const rangeQuery = {
            [condition.field]: {}
          };
          if (condition.operator === '=') {
              return {
                nested: {
                  path: nestedPath,
                  query: {
                    bool: {
                      must: [{
                        terms: { [condition.field]: { value: condition.value } }
                      }]
                    }
                  }
                }
              };
          } else if (condition.operator === '!=') {
              return {
                nested: {
                  path: nestedPath,
                  query: {
                    bool: {
                      must_not: [{
                        terms: { [condition.field]: { value: condition.value } }
                      }]
                    }
                  }
                } 
              };
          } else if (condition.operator === '>=') {
            rangeQuery[condition.field].gte = condition.value;
          } else if (condition.operator === '<=') {
            rangeQuery[condition.field].lte = condition.value;
          } else if (condition.operator === '>') {
            rangeQuery[condition.field].gt = condition.value;
          } else if (condition.operator === '<') {
            rangeQuery[condition.field].lt = condition.value;
          } 
          
          return {
            nested: {
              path: nestedPath,
              query: {
                bool: {
                  must: [{
                    range: rangeQuery
                  }]
                }
              }
            }
          };
        }
      } else {
        if (condition.operator === '=') {
          if (Array.isArray(condition.value)) {
            return { terms: { [condition.field]: condition.value } }; // Use 'terms' when there are multiple values
          } else {
            return { term: { [condition.field]: { value: condition.value } } };
          }
        } else if (condition.operator === '!=') {
          if (Array.isArray(condition.value)) {
            return { bool: { must_not: { terms: { [condition.field]: condition.value } } } }; // Use 'terms' with must_not for '!=' operator
          } else {
            return { bool: { must_not: { term: { [condition.field]: { value: condition.value } } } } };
          }
        }
        else if (condition.operator === '>=') {
          return { range: { [condition.field]: { gte: condition.value } } };
        } else if (condition.operator === '<=') {
          return { range: { [condition.field]: { lte: condition.value } } };
        } else if (condition.operator === '>') {
          return { range: { [condition.field]: { gt: condition.value } } };
        } else if (condition.operator === '<') {
          return { range: { [condition.field]: { lt: condition.value } } };
        }
      }
    }
  }

  // Build the Elasticsearch query from the parsed JSON
  const esQuery = buildQuery(parsedJSON);

  // Construct the query object based on the query type
  if (queryType === 'count') {
    return { query: esQuery };
  } else if (queryType === 'aggregation') {
    if (!aggregationType || !aggregationField) {
      return { error: 'MISSING_PARAMETERS', message: 'Missing aggregation type or field' };
    }

    const isAllowed = isAggregationAllowed(aggregationField, aggregationType);
    if (isAllowed === true) {
      if(aggregationType === 'date_histogram')
      {
          return {
            query: esQuery,
            aggs: {
              agg_name: {
                [aggregationType]: {
                  field: aggregationField,
                  fixed_interval: fixedInterval
                }
              }
            },
            size: size
          };
      }
      else if(aggregationType === 'histogram')
      {
          return {
            query: esQuery,
            aggs: {
              agg_name: {
                [aggregationType]: {
                  field: aggregationField,
                  interval: histo_interval
                }
              }
            },
            size: size
          };
      }  
      else 
      {
          return {
            query: esQuery,
            aggs: {
              agg_name: {
                [aggregationType]: {
                  field: aggregationField
                }
              }
            },
            size: size
          };
      }
      
    } else {
      return isAllowed;
    }
  } else if (queryType === 'search') {
    return {
      query: esQuery,
      size: size
    };
  } else {
    return { error: 'INVALID_QUERY_TYPE', message: 'Invalid query type' };
  }
}

/**
 * Checks if the specified aggregation type is allowed on the given field.
 * Validates against the field type extracted from the mapping.
 *
 * @param {string} fieldName - The name of the field.
 * @param {string} aggregationType - The type of aggregation (e.g., 'avg', 'sum').
 * @returns {object|boolean} - Returns true if allowed, otherwise an error object.
 */
function isAggregationAllowed(fieldName, aggregationType) {
  const fieldType = fields[fieldName];
  if (!fieldType) {
    return { error: 'FIELD_NOT_FOUND', message: `Field ${fieldName} not found in the mapping.` };
  }

  const allowedFieldTypes = aggregationFieldTypeMapping[aggregationType];
  if (!allowedFieldTypes) {
    return { error: 'INVALID_AGGREGATION_TYPE', message: `Aggregation type ${aggregationType} is not valid.` };
  }

  if (!allowedFieldTypes.includes(fieldType)) {
    return { error: 'AGGREGATION_NOT_ALLOWED', message: `Aggregation type ${aggregationType} is not allowed on field type ${fieldType}.` };
  }

  return true;
}



/**
 * Parse options from the options string
 * @param {string} optionsString - The options string
 * @returns {object} - Parsed options
 */
function parseOptions(optionsString) {
    const options = {};
    const optionsArray = optionsString.split(',').map(option => option.trim());

    for (const option of optionsArray) {
    
      if(validateOptions(option)){

        
        const [key, value] = option.split('=').map(item => item.trim());
        
        if(!(key === null || key === '' || value === null || value === '' || value === undefined))
        {
          options[key] = value.replace(/^"|"$/g, ''); // Remove surrounding quotes if any
        }
        else {
          return { errorCode: 'INVALID_OPTION', message: `Option ( ${option} ) is not valid` };
        }
      }
      else {
        return { errorCode: 'INVALID_OPTION', message: `Option ( ${option} ) is not valid` };
      }

        
    }

    return options;
}

/**
 * Main function to process the query string
 * @param {string} queryString - The query string
 * @returns {object} - Filter and options parts
 */
function splitFilterAndOptions(queryString) {
    const parts = queryString.split(';');

    if (parts.length > 2) {
        return { errorCode: 'INVALID_QUERY_FORMAT', message: 'Only one ";" is allowed to separate filter and options.' };
    }

    const filterPart = parts[0].trim();
    const optionsPart = parts[1] ? parts[1].trim() : '';

    // const tokens = tokenize(filterPart);
    // const parsedQuery = parseQuery(tokens, optionsPart);

    const options = optionsPart ? parseOptions(optionsPart) : {};

    if(options.errorCode)
    {
      return options;
    }

    return {
        filter: filterPart,
        options: options
    };
}

function createQuery(queryString){
  const result = splitFilterAndOptions(queryString);

  if (result.errorCode) {
      //console.error(`Error: ${result.errorCode} - ${result.message}`);
    return result;
  } 
  else {
    
      const tokens = tokenize(result.filter);
      const parsedJSON = parseQuery(tokens, result.options['timeZone']);

      if (parsedJSON.errorCode) {
        // console.error(`Error Code: ${parsedJSON.errorCode}`);
        // console.error(`Message: ${parsedJSON.message}`);
        return parsedJSON; 

      } else {
        // console.log("Parsed JSON:");
        // console.log(JSON.stringify(parsedJSON, null, 2));
        
        const esQuery = jsonToESQuery(parsedJSON, result.options);

        if (esQuery.errorCode || esQuery.error) {
          // console.error(`Error Code: ${esQuery.errorCode}`);
          // console.error(`Message: ${esQuery.message}`);
          
          return { 
            errorCode : (esQuery.errorCode) ? esQuery.errorCode : esQuery.error, 
            message : esQuery.message
          }

        } else {
          // console.log("Elasticsearch Query:");
          // console.log(JSON.stringify(esQuery, null, 2));
          
          return { 
            parsedJSON : parsedJSON, 
            query : esQuery
          }
        }
      }
      //const esQuery = jsonToESQuery(result.filter, result.options);
      //console.log('Elasticsearch Query:', JSON.stringify(esQuery, null, 2));
  }

}


module.exports = {
  tokenize,
  parseQuery,
  jsonToESQuery,
  isAggregationAllowed,
  createQuery,
  splitFilterAndOptions
};
