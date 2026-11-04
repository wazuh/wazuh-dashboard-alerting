/*
 * Copyright Wazuh Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getInitialActionValues } from './utils';
import { SAMPLE_DOCUMENTS_BLOCK_END, SAMPLE_DOCUMENTS_BLOCK_START } from './findings-message';
import { DEFAULT_MESSAGE_SOURCE } from '../../utils/constants';
import { MONITOR_TYPE } from '../../../../utils/constants';

jest.mock('../../../../services', () => ({
  ...jest.requireActual('../../../../services'),
  getApplication: () => ({
    getUrlForApp: () => 'https://dashboard.example/base/app/discover',
  }),
}));

const FINDINGS_INDICES = [{ label: 'wazuh-findings-v5-security' }];

const getMessage = (monitorType, indices) =>
  getInitialActionValues({ monitorType, actions: [], indices }).message_template.source;

// Same reading as the indexer: the tags inside the first sample documents block.
const getSampleDocumentsTags = (message) => {
  const start = message.indexOf(SAMPLE_DOCUMENTS_BLOCK_START);
  const end = message.indexOf(SAMPLE_DOCUMENTS_BLOCK_END, start);
  const block = message.substring(start + SAMPLE_DOCUMENTS_BLOCK_START.length, end);
  return [...block.matchAll(/\{\{([^{}]+)}}/g)].map(([, tag]) => tag.trim());
};

describe('getInitialActionValues', () => {
  test('describes each finding and links to it for per document monitors over findings', () => {
    const message = getMessage(MONITOR_TYPE.DOC_LEVEL, FINDINGS_INDICES);
    const tags = getSampleDocumentsTags(message);
    const sections = tags.filter((tag) => tag.startsWith('#_source.'));

    expect(message).toMatch(/^Monitor: \{\{ctx.monitor.name}}\nTrigger: \{\{ctx.trigger.name}}\n/);
    expect(message).toContain('{{#ctx.alerts}}');
    expect(tags).toEqual(
      expect.arrayContaining([
        '_source.wazuh.rule.title',
        '_source.wazuh.rule.level',
        '_source.wazuh.agent.id',
      ])
    );
    // The indexer only fetches the fields printed with a plain tag inside the block.
    expect(sections).toHaveLength(3);
    sections.forEach((section) => expect(tags).toContain(section.slice(1)));
    expect(message).toContain(
      'https://dashboard.example/base/app/discover#/doc/wazuh-findings-v5%2A/{{_index}}?id={{_id}}'
    );
  });

  test.each([
    ['a per document monitor over other indices', MONITOR_TYPE.DOC_LEVEL, [{ label: 'logs' }]],
    [
      'a per document monitor over findings and other indices',
      MONITOR_TYPE.DOC_LEVEL,
      [...FINDINGS_INDICES, { label: 'logs' }],
    ],
    ['a per query monitor over findings', MONITOR_TYPE.QUERY_LEVEL, FINDINGS_INDICES],
  ])('keeps the previous default message for %s', (_description, monitorType, indices) => {
    expect(getMessage(monitorType, indices)).toBe(DEFAULT_MESSAGE_SOURCE.QUERY_LEVEL_MONITOR);
  });
});
