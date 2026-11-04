/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiLink, EuiText, EuiTitle } from '@elastic/eui';
import { URL } from '../../../../utils/constants';
// Wazuh
import { FindingVariablesList } from '../../../pages/CreateTrigger/components/Action/actions/insert-variable';

const message = () => ({
  flyoutProps: {
    'aria-labelledby': 'messageFlyout',
    maxWidth: 500,
    size: 'm',
  },
  headerProps: { hasBorder: true },
  header: (
    <EuiTitle size="m" style={{ fontSize: '25px' }}>
      <h2>
        <strong>Message</strong>
      </h2>
    </EuiTitle>
  ),
  body: (
    <EuiText size="s">
      <p>
        {`You have access to a "ctx" variable in your painless scripts and action mustache templates.`}
      </p>
      {/* Wazuh: fields of a finding that the message of a per document monitor can print */}
      <h3>Finding variables</h3>
      <p>
        {`Per document monitors over findings can print these fields of the first finding. Inside a "{{#sample_documents}}" block, use the "{{_source.<field>}}" form to print them for every finding.`}
      </p>
      <FindingVariablesList />
      <h3>Learn More</h3>
      <ul>
        <li>
          <EuiLink target="_blank" href={URL.MUSTACHE} external>
            HTML Templates with Mustache.js
          </EuiLink>
        </li>
      </ul>
    </EuiText>
  ),
});

export default message;
