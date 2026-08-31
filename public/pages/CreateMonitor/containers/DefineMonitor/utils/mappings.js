/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export function shouldSkip(mapping) {
  const isDisabled = mapping.enabled === false;
  const hasIndexDisabled = mapping.index === false;
  const isNestedDataType = mapping.type === 'nested';
  return isDisabled || hasIndexDisabled || isNestedDataType;
}

export function resolvePath(path, field) {
  if (path) return `${path}.${field}`;
  return field;
}

export function getFieldsFromProperties(properties, dataTypes, path) {
  Object.entries(properties).forEach(([field, value]) => {
    getTypeFromMappings(value, dataTypes, resolvePath(path, field));
  });
}

export function getTypeFromMappings(mappings, dataTypes, path = '') {
  // Example structures of index mappings:
  // properties: { "field_name":{"properties": ...} }
  // properties: { "field_name":{"type": "text"} }
  if (shouldSkip(mappings)) return dataTypes;
  // if there are properties then type is inherently an object
  if (mappings.properties) {
    getFieldsFromProperties(mappings.properties, dataTypes, path);
    return dataTypes;
  }

  const type = mappings.type;

  if (dataTypes[type]) dataTypes[type].add(path);
  else dataTypes[type] = new Set([path]);

  if (mappings.fields && mappings.fields.keyword) {
    if (dataTypes['keyword']) dataTypes['keyword'].add(`${path}.keyword`);
    else dataTypes['keyword'] = new Set([`${path}.keyword`]);
  }
  return dataTypes;
}

export function getPathsPerDataType(mappings) {
  const dataTypes = {};
  Object.entries(mappings).forEach(([index, { mappings: docMappings }]) =>
    getTypeFromMappings(docMappings, dataTypes)
  );
  return dataTypes;
}

// WAZUH
// Wazuh indices are mapped with `dynamic: strict_allow_templates`, so most of their schema lives in
// `dynamic_templates` instead of `properties` — a field only reaches `properties` once a document
// actually carries it. The functions below read the templates too, so that the field selectors offer
// the whole schema of the selected index or alias and not just the part already in use.

// A `path_match` holding one of these characters matches a family of paths instead of a single one,
// so it is a pattern and not a field name that can be offered as an option.
const WAZUH_WILDCARD_PATTERN = /[*?]/;

export function addPathForType(dataTypes, type, path) {
  if (dataTypes[type]) dataTypes[type].add(path);
  else dataTypes[type] = new Set([path]);
  return dataTypes;
}

function getConcretePaths(pathMatch) {
  const patterns = Array.isArray(pathMatch) ? pathMatch : [pathMatch];
  return patterns.filter(
    (pattern) => typeof pattern === 'string' && pattern && !WAZUH_WILDCARD_PATTERN.test(pattern)
  );
}

function getMappedPaths(dataTypes) {
  return new Set(Object.values(dataTypes).flatMap((paths) => Array.from(paths)));
}

/**
 * Adds the fields declared by dynamic templates to the given data types.
 *
 * Only templates naming a concrete path are usable: a pattern such as `type_hashes.*.hash.sha256`
 * is not a field, and a type resolved at index time (`{dynamic_type}`) is not a known data type.
 */
export function getFieldsFromDynamicTemplates(dynamicTemplates, dataTypes) {
  if (!Array.isArray(dynamicTemplates)) return dataTypes;
  const mappedPaths = getMappedPaths(dataTypes);
  dynamicTemplates.forEach((dynamicTemplate) => {
    // Example structure: [{ "template_name": { "path_match": "agent.id", "mapping": {...} } }]
    Object.values(dynamicTemplate || {}).forEach((template) => {
      const mapping = template?.mapping;
      if (!mapping || shouldSkip(mapping)) return;

      const type = mapping.type;
      // An `object` template only groups sub-fields, it does not describe a queryable leaf.
      if (!type || type === 'object' || type.includes('{')) return;

      getConcretePaths(template.path_match).forEach((path) => {
        // A path taken from `properties` is already mapped, the template no longer applies to it.
        if (mappedPaths.has(path)) return;
        mappedPaths.add(path);
        addPathForType(dataTypes, type, path);

        const keywordPath = `${path}.keyword`;
        if (mapping.fields?.keyword && !mappedPaths.has(keywordPath)) {
          mappedPaths.add(keywordPath);
          addPathForType(dataTypes, 'keyword', keywordPath);
        }
      });
    });
  });
  return dataTypes;
}

/**
 * Same as `getPathsPerDataType`, with the fields declared by dynamic templates included.
 */
export function getPathsPerDataTypeWithDynamicTemplates(mappings) {
  const dataTypes = {};
  const indexMappings = Object.values(mappings)
    .map(({ mappings: docMappings } = {}) => docMappings || {})
    .filter((docMappings) => !shouldSkip(docMappings));
  // The concrete mappings go first so that a field present in `properties` keeps the type it is
  // actually mapped with, instead of the one a dynamic template matching the same path declares.
  indexMappings.forEach((docMappings) => {
    if (docMappings.properties) getFieldsFromProperties(docMappings.properties, dataTypes, '');
  });
  indexMappings.forEach((docMappings) =>
    getFieldsFromDynamicTemplates(docMappings.dynamic_templates, dataTypes)
  );
  return dataTypes;
}
