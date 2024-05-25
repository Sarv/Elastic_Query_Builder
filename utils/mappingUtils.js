const fs = require('fs');

/**
 * Loads the Elasticsearch index mapping from a file.
 * Extracts all fields and indexed fields from the mapping.
 *
 * @returns {object} - An object containing all fields and indexed fields.
 */
function loadMapping() {
  try {
    const mapping = JSON.parse(fs.readFileSync('mapping.json', 'utf8'));
    const allFields = {};
    const indexedFields = {};

    /**
     * Recursively extracts fields and their properties from the mapping.
     *
     * @param {object} properties - The properties of the current mapping level.
     * @param {string} prefix - The prefix for nested fields.
     */
    function extractFields(properties, prefix = '') {
      for (const field in properties) {
        const fieldProperties = properties[field];
        const fieldType = fieldProperties.type;
        const isIndexed = fieldProperties.index !== false && fieldProperties.enabled !== false;

        if (fieldType) {
          allFields[`${prefix}${field}`] = fieldType;
          if (isIndexed) {
            indexedFields[`${prefix}${field}`] = fieldType;
          }
        }

        if (fieldProperties.properties) {
          extractFields(fieldProperties.properties, `${prefix}${field}.`);
        }
      }
    }

    for (const index in mapping) {
      if (mapping[index].mappings && mapping[index].mappings.properties) {
        extractFields(mapping[index].mappings.properties);
      } else {
        console.error('Invalid mapping structure:', JSON.stringify(mapping, null, 2));
        throw new Error('Invalid mapping structure');
      }
    }

    return { allFields, indexedFields };
  } catch (error) {
    console.error('Error loading mapping:', error.message);
    throw error;
  }
}

module.exports = {
  loadMapping
};
