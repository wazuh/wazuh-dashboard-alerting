/*
 * Copyright Wazuh Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * Wazuh: default message of the notifications sent by per document monitors over findings, and the
 * finding fields the message editor offers as variables.
 *
 * The indexer only reads the documents that raised the alerts into
 * `ctx.alerts[].sample_documents[]` when the message mentions `sample_documents`, and then only
 * fetches the fields printed with a plain `{{_source.<field>}}` tag inside a literal
 * `{{#sample_documents}}...{{/sample_documents}}` block. Section tags such as
 * `{{#_source.<field>}}` are not counted, so every section also prints its field with a plain tag.
 */

import _ from 'lodash';
import { isActiveResponseFindingsIndex } from '../../../../utils/validate';
import { getApplication } from '../../../../services';

export const SAMPLE_DOCUMENTS_BLOCK_START = '{{#sample_documents}}';
export const SAMPLE_DOCUMENTS_BLOCK_END = '{{/sample_documents}}';

// Path of the first document that raised the first alert, for tags outside a sample documents block.
export const FIRST_SAMPLE_DOCUMENT_PATH = 'ctx.alerts.0.sample_documents.0';

export const FINDINGS_INDEX_PATTERN_ID = 'wazuh-findings-v5*';

export const FINDING_FIELDS = {
  TITLE: 'wazuh.rule.title',
  SEVERITY: 'wazuh.rule.level',
  ENDPOINT_NAME: 'wazuh.agent.name',
  ENDPOINT_ID: 'wazuh.agent.id',
  USER: 'user.name',
  SOURCE_IP: 'source.ip',
};

/**
 * Whether a monitor only watches findings indices.
 *
 * @param {Array<string|{label: string}>} [indices] monitor indices, as strings or as the options of
 * the index field
 */
export const isFindingsMonitor = (indices) =>
  !_.isEmpty(indices) &&
  indices.every((index) => isActiveResponseFindingsIndex(_.isString(index) ? index : index?.label));

/**
 * Absolute URL of Discover, with the base path of the dashboard. The link is written into the
 * message when the action is created, as the indexer does not know the dashboard address.
 */
export const getDiscoverUrl = () => {
  try {
    return getApplication().getUrlForApp('discover', { absolute: true });
  } catch (error) {
    return `${window.location.origin}/app/discover`;
  }
};

/*
 * Discover route of a single document: `#/doc/<index pattern id>/<index>?id=<document id>`. The `*`
 * of the index pattern id is percent-encoded so chat apps that read it as markup keep the link
 * whole; Discover decodes the route before matching it.
 */
const DOC_ROUTE_INDEX_PATTERN_ID = encodeURIComponent(FINDINGS_INDEX_PATTERN_ID).replace(
  /\*/g,
  '%2A'
);

/**
 * Mustache text of the link to a finding in Discover.
 *
 * @param {string} discoverUrl see getDiscoverUrl
 * @param {string} [documentPath] path of the sample document; empty inside a sample documents block
 */
export const getFindingLink = (discoverUrl, documentPath = '') => {
  const prefix = documentPath ? `${documentPath}.` : '';
  return `${discoverUrl}#/doc/${DOC_ROUTE_INDEX_PATTERN_ID}/{{${prefix}_index}}?id={{${prefix}_id}}`;
};

/**
 * Default message of a per document monitor over findings: one entry per finding with its title,
 * severity, endpoint, user and source when present, and a link to it.
 *
 * @param {string} discoverUrl see getDiscoverUrl
 */
export const getFindingsMessageSource = (discoverUrl) =>
  `
Monitor {{ctx.monitor.name}} raised {{ctx.trigger.name}}.
{{#ctx.alerts}}
${SAMPLE_DOCUMENTS_BLOCK_START}

- Finding: {{{_source.${FINDING_FIELDS.TITLE}}}} (severity: {{_source.${FINDING_FIELDS.SEVERITY}}})
{{#_source.${FINDING_FIELDS.ENDPOINT_NAME}}}
  Endpoint: {{_source.${FINDING_FIELDS.ENDPOINT_NAME}}} ({{_source.${FINDING_FIELDS.ENDPOINT_ID}}})
{{/_source.${FINDING_FIELDS.ENDPOINT_NAME}}}
{{#_source.${FINDING_FIELDS.USER}}}
  User: {{_source.${FINDING_FIELDS.USER}}}
{{/_source.${FINDING_FIELDS.USER}}}
{{#_source.${FINDING_FIELDS.SOURCE_IP}}}
  Source: {{_source.${FINDING_FIELDS.SOURCE_IP}}}
{{/_source.${FINDING_FIELDS.SOURCE_IP}}}
  View: ${getFindingLink(discoverUrl)}
${SAMPLE_DOCUMENTS_BLOCK_END}
{{/ctx.alerts}}
`.trim();
