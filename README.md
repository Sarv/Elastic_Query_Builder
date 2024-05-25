

# Elasticsearch Query Builder

## Overview

The Elasticsearch Query Builder project is designed to convert a string input into a valid Elasticsearch (ES) query. It handles various query types like search, count, and aggregation, and supports nested fields, date manipulations, and validation against an Elasticsearch mapping. The project consists of multiple JavaScript files, each serving a specific purpose.

![ElasticSearch Query Builder Flow](https://github.com/Sarv/Elastic_Query_Builder/blob/a8ef43d48031b112e117ca6e0b6825256ef41704/Elastic_Query_Builder.png)

## Project Structure
```
/project-directory
|-- mapping.json
|-- main.js
|-- console.js
|-- nestedQueryParser.js
|-- utils
|---- dateUtils.js
|---- queryUtils.js
|---- mappingUtils.js
```

## Files and Directories

1. **mapping.json**: Contains the Elasticsearch mapping, which defines the fields and their types.
2. **main.js**: Main entry point for converting string input to ES query.
3. **console.js**: Console-based interface for interacting with the query Builder.
4. **nestedQueryParser.js**: Core logic for parsing and converting queries.
5. **utils**: Directory containing utility functions.
   - **dateUtils.js**: Functions for date manipulation and validation.
   - **queryUtils.js**: Functions for tokenizing input and validating query components.
   - **mappingUtils.js**: Functions for loading and processing the mapping file.

## Detailed Explanation

### mapping.json


The `mapping.json` file contains the Elasticsearch index mapping, which defines the schema for your index, including field names, types, and indexing options. This file is essential for validating queries and ensuring that they conform to the structure of your Elasticsearch index.

#### Steps to Create `mapping.json`

1.  **Retrieve the Mapping from Elasticsearch**:
    
    -   Use the Elasticsearch `_mapping` API to retrieve the mapping for your index. Replace `your_index_name` with the name of your index.
   
    ```console 
    curl -X GET "localhost:9200/your_index_name/_mapping?pretty"
    ``` 
 
    -   This command will output the mapping of your index in JSON format.
2.  **Save the Mapping to a File**:
    
    -   Copy the output of the `_mapping` API call.
    -   Create a new file named `mapping.json` in your project directory.
    -   Paste the copied JSON content into the `mapping.json` file and save it.
    
##### **Example:**

```json
{
  "YOUR_ELASTIC_INDEX": {
    "mappings": {
      "properties": {
        "mobile": {
          "type": "keyword"
        },
        "name": {
          "type": "keyword"
        },
        "gender": {
          "type": "keyword"
        }
      }
    }
  }
}
```


### **main.js**
The `main.js` file serves as the main entry point for the project. It provides functions to parse a query string and convert it into an Elasticsearch query.

##### **Example Usage:**

```javascript
const { tokenize, parseQuery, jsonToESQuery } = require('./nestedQueryParser');
const mapping = require('./mapping.json');

// Sample query string
const queryString = 'age > 31 and gender = "male"';
const timeZone = 'Z'; // Default time zone
const queryType = 'search'; // Query type: search, count, or aggregation
const aggregationType = null; // Aggregation type, e.g., 'avg', 'sum'
const aggregationField = null; // Field for aggregation
const fixedInterval = '1d'; // Fixed interval for date_histogram
const size = 10; // Size of the search results

// Tokenize the query string
const tokens = tokenize(queryString);

// Parse the tokens into a JSON structure
const parsedQuery = parseQuery(tokens, timeZone);

// Convert the parsed JSON into an Elasticsearch query
const esQuery = jsonToESQuery(parsedQuery, queryType, aggregationType, aggregationField, fixedInterval, size);

console.log('Parsed JSON:', JSON.stringify(parsedQuery, null, 2));
console.log('Elasticsearch Query:', JSON.stringify(esQuery, null, 2));
```

### **console.js**
The `console.js` file provides a command-line interface for interacting with the query Builder. It prompts the user for input and processes the query in a loop until the user exits.

##### **Example Usage:**

Run the script using Node.js:

 
```console  
   node console.js
```

The script will prompt for a query string, query type, and other parameters, and then output the parsed JSON and Elasticsearch query.

### **nestedQueryParser.js**
The `nestedQueryParser.js` file contains the core logic for parsing query strings and converting them into Elasticsearch queries. It includes functions for tokenizing, parsing, and building ES queries.

##### **Key Functions:**

 - `tokenize(input)`: Tokenizes the input query string into individual
   tokens.
 - `parseQuery(tokens, timeZone)`: Parses the tokenized query string into
   an expression tree.
 - `jsonToESQuery(parsedJSON, queryType, aggregationType,
   aggregationField, fixedInterval, size)`: Converts the parsed JSON
   expression tree into an Elasticsearch query.
 - `isAggregationAllowed(fieldName, aggregationType)`: Checks if the
   specified aggregation type is allowed on the given field.

### **utils/dateUtils.js**
The `dateUtils.js` file contains functions for date manipulation and validation.

##### **Key Functions:**

 - `parseRelativeDate(dateString, timeZone)`: Parses relative date strings
   like `now`, `today`, `now-2h`, etc. 
 - `formatDateString(dateString, timeZone)`: Formats date strings into the
   required format with the specified time zone.

### **utils/queryUtils.js**
The `queryUtils.js` file contains utility functions for tokenizing input and validating query components.

##### **Key Functions:**

 - `validateFixedInterval(interval)`: Validates the fixed interval for
   date histogram aggregations.
 - `validateSize(size)`: Validates the size parameter for search queries.
 - `tokenize(input)`: Tokenizes the input query string into individual
   tokens.

### **utils/mappingUtils.js**
The `mappingUtils.js` file contains functions for loading and processing the mapping file.

##### **Key Functions:**

 - `loadMapping()`: Loads the mapping from `mapping.json` and extracts
   fields and indexed fields. 



## Installation

 1. **Clone the Repository**

```console
 git clone https://github.com/yourusername/es-query-Builder.git
 cd es-query-Builder
```

 2. **Install Dependencies**

```console
 npm install
```

## Running the Project

 1. Run Main Script

```console
 node main.js
```
 2. Run Console Interface

```console
 node console.js
```




## Examples of Valid and Invalid Query Strings

### Valid Query Strings

 1. `(gender = "female" or age != 30)`
 2. `(profession.empCode = "183" and address.country = "India")`
 3. `(createDate <= "now" and createDate >= "2023-10-30 11:45:00.432")`

### Invalid Query Strings

 1. `(marks = 189)` (Field not present in mapping)  
   --- `Error`: **Field marks not found in the mapping.**



## Using Different Kinds of Operators
### Supported Operators

 - `=` : Equality
- `!=` : Inequality
- `>=` : Greater than or equal to
- `<=` : Less than or equal to
- `>` : Greater than
- `<` : Less than

### Example
Query String:

    'age > 31 and gender = "male"'

Resulting Elasticsearch Query:
```json
{
  "query": {
    "bool": {
      "must": [
        {
          "range": {
            "age": {
              "gt": "31"
            }
          }
        },
        {
          "term": {
            "gender": {
              "value": "male"
            }
          }
        }
      ]
    }
  },
  "size": 10
}

```


## Possible and Default Values of Important Variables

 - `queryType` : **search**, **count**, **aggregation** (default: search)

- `aggregationType` : **avg**, **sum**, **min**, **max**, **terms**, etc. (default: null)
- `fixedInterval` : Interval for date histogram (default: 1d)
- `size` : Size parameter for search queries (default: 10)
- `timeZone` : Time zone offset (default: Z)


## Date Field Formats
Date fields can support various formats as values in the query string. The project provides functionality to handle these formats:

#### Supported Formats

1. **Exact Date** : A specific date and time.
--- `Format` : **YYYY-MM-DD HH:mm:ss.SSS**
--- `Example` : **"2024-05-13 12:00:00.432"**

2. **Relative Date** : Relative to the current date and time.
--- `Format` : **now**, **today**, **now-2h**, **today+2d**, etc.
--- `Example` : **"now-2h"** (2 hours ago from now)

3. **Time Zone Support** : Adjusts dates based on the specified time zone.
--- `Format` : **+05:30**, **-02:00**, etc.
--- `Example` : **"2024-05-13 12:00:00.432+05:30"**

#### Example
Query String:

    'createDate <= "now" and createDate >= "2023-10-30 11:45:00.432"'

Time Zone:

```javascript
	const timeZone = '+05:30';
```

Resulting Elasticsearch Query:
```json
{
  "query": {
    "bool": {
      "must": [
        {
          "range": {
            "createDate": {
              "lte": "2024-05-25T17:04:35.395+05:30"
            }
          }
        },
        {
          "range": {
            "createDate": {
              "gte": "2023-10-30T11:45:00.432+05:30"
            }
          }
        }
      ]
    }
  },
  "size": 10
}


```

## Example Output of parseQuery Function
####  Query String

    '(profession.status = "active" and createDate >= "2023-10-30 11:45:00.432") or (gender = "male" and age > 30) or (address.country = "India" or durations > 9782 ) '

#### Result
```json

{
  "conditions": [
    {
      "conditions": [
        {
          "field": "profession.status",
          "operator": "=",
          "value": "active"
        },
        {
          "field": "createDate",
          "operator": ">=",
          "value": "2023-10-30T11:45:00.432+05:30"
        }
      ],
      "logicGate": "and"
    },
    {
      "conditions": [
        {
          "field": "gender",
          "operator": "=",
          "value": "male"
        },
        {
          "field": "age",
          "operator": ">",
          "value": "30"
        }
      ],
      "logicGate": "and"
    },
    {
      "conditions": [
        {
          "field": "address.country",
          "operator": "=",
          "value": "India"
        },
        {
          "field": "durations",
          "operator": ">",
          "value": "9782"
        }
      ],
      "logicGate": "or"
    }
  ],
  "logicGate": "or"
}
```

## Example Output of jsonToESQuery Function

#### Query String

    '(profession.status = "active" and createDate >= "2023-10-30 11:45:00.432") or (gender = "male" and age > 30) or (address.country = "India" or durations > 9782 ) '


#### Resulting Elasticsearch Query
```json
{
  "query": {
    "bool": {
      "should": [
        {
          "bool": {
            "must": [
              {
                "nested": {
                  "path": "profession",
                  "query": {
                    "bool": {
                      "must": [
                        {
                          "term": {
                            "profession.status": {
                              "value": "active"
                            }
                          }
                        }
                      ]
                    }
                  }
                }
              },
              {
                "range": {
                  "createDate": {
                    "gte": "2023-10-30T11:45:00.432+05:30"
                  }
                }
              }
            ]
          }
        },
        {
          "bool": {
            "must": [
              {
                "term": {
                  "gender": {
                    "value": "male"
                  }
                }
              },
              {
                "range": {
                  "age": {
                    "gt": "30"
                  }
                }
              }
            ]
          }
        },
        {
          "bool": {
            "should": [
              {
                "nested": {
                  "path": "address",
                  "query": {
                    "bool": {
                      "must": [
                        {
                          "term": {
                            "address.country": {
                              "value": "India"
                            }
                          }
                        }
                      ]
                    }
                  }
                }
              },
              {
                "range": {
                  "durations": {
                    "gt": "9782"
                  }
                }
              }
            ]
          }
        }
      ]
    }
  },
  "size": 10
}

```
## Nested Fields and How to Query Them
Nested fields are fields that are objects containing other fields. To query nested fields, use the dot notation to specify the path to the nested field.

### Example:

##### Query String:

> 'profession.status = "active"'

##### Resulting Elasticsearch Query:

```json
{
  "query": {
    "bool": {
      "must": [
        {
          "nested": {
            "path": "profession",
            "query": {
              "bool": {
                "must": [
                  {
                    "term": {
                      "profession.status": {
                        "value": "active"
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      ]
    }
  },
  "size": 10
}
```


## Aggregation Query

#### Query String

    'profession.status = "active" and createDate >= "today-2d"'


#### Aggregation Type

    'date_histogram'

#### Aggregation Field

    'createDate'

#### Fixed Interval

    '1h'

#### Resulting Elasticsearch Query
```json
{
  "query": {
    "bool": {
      "must": [
        {
          "nested": {
            "path": "profession",
            "query": {
              "bool": {
                "must": [
                  {
                    "term": {
                      "profession.status": {
                        "value": "active"
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        {
          "range": {
            "createDate": {
              "gte": "2024-05-23T00:00:00.000+05:30"
            }
          }
        }
      ]
    }
  },
  "aggs": {
    "agg_name": {
      "date_histogram": {
        "field": "createDate",
        "fixed_interval": "1d"
      }
    }
  }
}

```

## Query on Non-Indexed Fields
### Overview

In Elasticsearch, fields in a document can be indexed or non-indexed. Indexed fields are searchable and can be used in queries, while non-indexed fields are not searchable. The ability to query a field is crucial for ensuring efficient and accurate searches. This project includes a mechanism to check whether a field is indexed before allowing it to be used in a query.

### How It Works

1.  **Loading the Mapping**:
    
    -   The mapping of an Elasticsearch index is loaded from a `mapping.json` file. This file contains the schema of the index, defining each field and its type, along with whether it is indexed.
2.  **Parsing the Mapping**:
    
    -   The mapping is parsed to extract the necessary information about each field. This includes checking the `index` property of each field to determine if it is indexed. If the `index` property is `true`, the field is considered indexed. If the `index` property is `false` or the field has the `enabled` property set to `false`, the field is considered non-indexed.
3.  **Validation**:
    
    -   During query parsing, each field referenced in the query is checked against the parsed mapping. If a field is not found in the mapping or is found to be non-indexed, an error is returned, and the field is not allowed to be used in the query.


### Example
Mapping Example :

```json
    {
      "YOUR_ELASTIC_INDEX": {
        "mappings": {
          "properties": {
            "gender": {
              "type": "keyword",
              "index": true
            },
            "activityLog": {
              "type": "object",
              "enabled": false
            }
          }
        }
      }
    }
``` 
In this example:

-   `gender` is an indexed field (`"index": true`).
-   `activityLog` is a non-indexed field (`"enabled": false`).

**Query Validation**:

-   If a query attempts to use `gender`, it is allowed because `gender` is indexed.
-   If a query attempts to use `activityLog`, an error is returned because `activityLog` is not indexed.


**Query String** :  

    '(activityLog = "value")'

**Error** :

```console
    {
      "errorCode": "FIELD_NOT_INDEXED",
      "message": "Field activityLog is present but not indexed."
    }
```

This mechanism ensures that only indexed fields are queried, preventing errors and improving the performance of Elasticsearch queries. By validating fields against the mapping, we maintain the integrity and efficiency of search operations.

## Error Codes and Messages
This document provides a comprehensive list of error codes and corresponding error messages used in the Elasticsearch Query Builder project.



| Error Code               | Error Message                                                                 |
|--------------------------|-------------------------------------------------------------------------------|
| INVALID_FIELD            | Invalid field `{field}` found.                                                |
| FIELD_NOT_INDEXED        | Field `{field}` is present but not indexed.                                   |
| OPERATOR_NOT_ALLOWED     | Operator `{operator}` is not allowed for field type `{fieldType}`.            |
| INVALID_OPERATOR         | Invalid operator `{operator}` found.                                          |
| INVALID_DATE_FORMAT      | Date format should be `YYYY-MM-DD HH:mm:ss.SSS`.                              |
| INVALID_TIMEZONE_FORMAT  | Time zone format should be Z or ±HH:MM                                        |
| INVALID_FIXED_INTERVAL   | Fixed interval format should be a number followed by `s` (seconds), `m` (minutes), `h` (hours), `d` (days), `w` (weeks), `M` (months), or `y` (years). |
| AGGREGATION_NOT_ALLOWED  | Aggregation `{aggregationType}` is not allowed on field type `{fieldType}`.   |
| INVALID_AGGREGATION_TYPE | Invalid aggregation type `{aggregationType}` specified.                       |
| MISSING_FIELD            | Field is missing before operator `{operator}`.                                |
| FIELD_TYPE_NOT_DEFINED   | Field type for `{field}` is not defined.                                      |
| FIELD_NOT_FOUND          | Field `{fieldName}` not found in the mapping.                                 |
| INVALID_QUERY_TYPE       | Invalid query type                                                            |
| MISSING_PARAMETERS       | Missing aggregation type or field                                             |
| INVALID_SIZE             | Size must be a positive integer.                                              |


**In the table above:**

- `{field}` will be replaced by the name of the field causing the error.
- `{operator}` will be replaced by the operator causing the error.
- `{fieldType}` will be replaced by the type of the field.
- `{aggregationType}` will be replaced by the type of aggregation.
- `{fieldName}` will be replaced by the name of the field.




## Conclusion
This project provides a flexible and powerful way to convert query strings into Elasticsearch queries, with support for various query types, nested fields, and date manipulations. The structure and utility functions are designed to be modular and easy to extend for additional features.
