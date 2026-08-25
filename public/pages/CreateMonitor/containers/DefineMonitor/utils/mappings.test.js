/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getPathsPerDataType } from './mappings';

describe('getPathsPerDataType', () => {
  test('returns correct dataTypes', () => {
    const mappings = {
      random_index: {
        mappings: {
          properties: {
            '@message': { type: 'text' },
            '@timestamp': { type: 'date' },
            username: { type: 'keyword' },
            memory: { type: 'double' },
            phpmemory: { type: 'long' },
            bytes: { type: 'long' },
            clientip: { type: 'ip' },
            id: { type: 'integer' },
            ip: { type: 'ip' },
          },
        },
      },
    };
    expect(getPathsPerDataType(mappings)).toEqual({
      text: new Set(['@message']),
      date: new Set(['@timestamp']),
      keyword: new Set(['username']),
      double: new Set(['memory']),
      long: new Set(['phpmemory', 'bytes']),
      ip: new Set(['clientip', 'ip']),
      integer: new Set(['id']),
    });
  });
});

// WAZUH
import { getPathsPerDataTypeWithDynamicTemplates } from './mappings';

describe('getPathsPerDataTypeWithDynamicTemplates', () => {
  test('returns the same dataTypes as getPathsPerDataType when there are no dynamic templates', () => {
    const mappings = {
      random_index: {
        mappings: {
          properties: {
            '@timestamp': { type: 'date' },
            username: { type: 'keyword' },
          },
        },
      },
    };
    expect(getPathsPerDataTypeWithDynamicTemplates(mappings)).toEqual({
      date: new Set(['@timestamp']),
      keyword: new Set(['username']),
    });
  });

  test('includes the fields declared by dynamic templates', () => {
    const mappings = {
      'wazuh-alerts': {
        mappings: {
          dynamic: 'strict_allow_templates',
          dynamic_templates: [
            { wcs_agent_id: { path_match: 'agent.id', mapping: { type: 'keyword' } } },
            { wcs_timestamp: { path_match: '@timestamp', mapping: { type: 'date' } } },
            {
              wcs_rule_description: {
                path_match: ['rule.description', 'rule.mitre.technique'],
                mapping: { type: 'text', fields: { keyword: { type: 'keyword' } } },
              },
            },
          ],
          properties: {
            'agent.name': { type: 'keyword' },
          },
        },
      },
    };
    expect(getPathsPerDataTypeWithDynamicTemplates(mappings)).toEqual({
      keyword: new Set([
        'agent.name',
        'agent.id',
        'rule.description.keyword',
        'rule.mitre.technique.keyword',
      ]),
      date: new Set(['@timestamp']),
      text: new Set(['rule.description', 'rule.mitre.technique']),
    });
  });

  test('skips dynamic templates that do not describe a queryable field', () => {
    const mappings = {
      'wazuh-states-inventory': {
        mappings: {
          dynamic_templates: [
            // Patterns match a family of paths, not a single field.
            { hash256: { path_match: 'type_hashes.*.hash.sha256', mapping: { type: 'keyword' } } },
            // Types resolved at index time are unknown until a document arrives.
            { dynamic: { path_match: 'labels.env', mapping: { type: '{dynamic_type}' } } },
            // Object templates only group sub-fields.
            { objects: { path_match: 'package', mapping: { type: 'object' } } },
            // Non-searchable or nested fields cannot be queried by path.
            {
              not_indexed: {
                path_match: 'event.original',
                mapping: { type: 'text', index: false },
              },
            },
            { nested: { path_match: 'process.args', mapping: { type: 'nested' } } },
            // Templates matching by type alone name no path.
            { strings: { match_mapping_type: 'string', mapping: { type: 'keyword' } } },
            { valid: { path_match: 'agent.id', mapping: { type: 'keyword' } } },
          ],
        },
      },
    };
    expect(getPathsPerDataTypeWithDynamicTemplates(mappings)).toEqual({
      keyword: new Set(['agent.id']),
    });
  });

  test('keeps the type of a mapped field over the one its dynamic template declares', () => {
    const mappings = {
      first_index: {
        mappings: {
          dynamic_templates: [
            { wcs_agent_id: { path_match: 'agent.id', mapping: { type: 'keyword' } } },
          ],
        },
      },
      second_index: {
        mappings: {
          properties: { agent: { properties: { id: { type: 'text' } } } },
        },
      },
    };
    expect(getPathsPerDataTypeWithDynamicTemplates(mappings)).toEqual({
      text: new Set(['agent.id']),
    });
  });
});
