/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const POPOVER_STYLE = { zIndex: '200' };
export const EXPRESSION_STYLE = { padding: '20px', whiteSpace: 'nowrap' };
export const Expressions = {
  THRESHOLD: 'THRESHOLD',
  WHEN: 'WHEN',
  OF_FIELD: 'OF_FIELD',
  OVER: 'OVER',
  FOR_THE_LAST: 'FOR_THE_LAST',
  WHERE: 'WHERE',
  METRICS: 'METRICS',
  GROUP_BY: 'GROUP_BY',
};
export const NUMBER_TYPES = [
  'long',
  'integer',
  'short',
  'byte',
  'double',
  'float',
  'half_float',
  'scaled_float',
];
export const UNITS_OF_TIME = [
  { value: 'm', text: 'minute(s)' },
  { value: 'h', text: 'hour(s)' },
  { value: 'd', text: 'day(s)' },
];

export const WHERE_BOOLEAN_FILTERS = [
  { text: 'Select value', value: '' },
  { text: 'True', value: true },
  { text: 'False', value: false },
];

// Wazuh: field type groups used to declare which operators each type supports.
const RANGE_COMPARABLE_TYPES = ['number', 'date']; // support :>, :>=, :<, :<= in query_string
const EQUALITY_TYPES = ['number', 'text', 'keyword', 'boolean', 'date', 'ip'];
const NULLABLE_TYPES = ['number', 'text', 'keyword', 'boolean', 'date', 'ip'];
const TEXT_TYPES = ['text', 'keyword'];

export const OPERATORS_MAP = {
  IS: {
    text: 'is',
    value: 'is',
    dataTypes: EQUALITY_TYPES, // Wazuh: extend operator support
  },
  IS_NOT: {
    text: 'is not',
    value: 'is_not',
    dataTypes: EQUALITY_TYPES, // Wazuh: extend operator support
  },
  IS_NULL: {
    text: 'is null',
    value: 'is_null',
    dataTypes: NULLABLE_TYPES, // Wazuh: extend operator support
  },
  IS_NOT_NULL: {
    text: 'is not null',
    value: 'is_not_null',
    dataTypes: NULLABLE_TYPES, // Wazuh: extend operator support
  },
  IS_GREATER: {
    text: 'is greater than',
    value: 'is_greater',
    dataTypes: RANGE_COMPARABLE_TYPES, // Wazuh: extend operator support
  },
  IS_GREATER_EQUAL: {
    text: 'is greater than equal',
    value: 'is_greater_equal',
    dataTypes: RANGE_COMPARABLE_TYPES, // Wazuh: extend operator support
  },
  IS_LESS: {
    text: 'is less than',
    value: 'is_less',
    dataTypes: RANGE_COMPARABLE_TYPES, // Wazuh: extend operator support
  },
  IS_LESS_EQUAL: {
    text: 'is less than equal',
    value: 'is_less_equal',
    dataTypes: RANGE_COMPARABLE_TYPES, // Wazuh: extend operator support
  },
  STARTS_WITH: {
    text: 'starts with',
    value: 'starts_with',
    dataTypes: TEXT_TYPES, // Wazuh: extend operator support
  },
  ENDS_WITH: {
    text: 'ends with',
    value: 'ends_with',
    dataTypes: TEXT_TYPES, // Wazuh: extend operator support
  },
  CONTAINS: {
    text: 'contains',
    value: 'contains',
    dataTypes: TEXT_TYPES, // Wazuh: extend operator support
  },
  DOES_NOT_CONTAINS: {
    text: 'does not contain',
    value: 'does_not_contains',
    dataTypes: ['text'],
  },
  IN_RANGE: {
    text: 'is in range',
    value: 'in_range',
    dataTypes: ['number'],
  },
  NOT_IN_RANGE: {
    text: 'is not in range',
    value: 'not_in_range',
    dataTypes: ['number'],
  },
};

export const OVER_TYPES = [{ value: 'all documents', text: 'all documents' }];

export const AGGREGATION_TYPES = [
  { value: 'avg', text: 'average()' },
  { value: 'count', text: 'count()' },
  { value: 'sum', text: 'sum()' },
  { value: 'min', text: 'min()' },
  { value: 'max', text: 'max()' },
];

export const GROUP_BY_ERROR = 'Must specify at least 1 group by expression.';
export const QUERY_TYPE_GROUP_BY_ERROR = 'Can have a maximum of 1 group by selections.';

export const QUERY_TYPE_METRIC_ERROR = 'Can have a maximum of 1 metric selections.';

export const MAX_NUM_QUERY_LEVEL_GROUP_BYS = 1;
export const MAX_NUM_BUCKET_LEVEL_GROUP_BYS = 2;
export const MAX_NUM_WHERE_EXPRESSION = 1;
export const WHERE_FILTER_ALLOWED_TYPES = ['number', 'text', 'keyword', 'boolean'];
