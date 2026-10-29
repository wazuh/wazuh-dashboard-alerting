/*
 * Copyright Wazuh Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import AlertFindingLink from './AlertFindingLink';

const alert = {
  finding_ids: ['findingId'],
  related_doc_ids: ['docId|.ds-wazuh-findings-v5-security-000001'],
};

const renderLink = async (response) => {
  const httpClient = { get: jest.fn().mockResolvedValue(response) };
  let wrapper;
  await act(async () => {
    wrapper = mount(
      <AlertFindingLink alert={alert} httpClient={httpClient}>
        <span data-test-subj="findingLink">link</span>
      </AlertFindingLink>
    );
  });
  wrapper.update();
  return { wrapper, httpClient };
};

describe('AlertFindingLink', () => {
  test('renders the link when the finding of the alert is stored', async () => {
    const { wrapper, httpClient } = await renderLink({
      ok: true,
      findings: [{ findingId: {} }],
    });

    expect(httpClient.get).toHaveBeenCalledWith('../api/alerting/findings/_search', {
      query: expect.objectContaining({ id: 'findingId' }),
    });
    expect(wrapper.find('[data-test-subj="findingLink"]').exists()).toBe(true);
    expect(wrapper.find('EuiIconTip').exists()).toBe(false);
  });

  test.each([
    ['is not stored', { ok: true, findings: [] }],
    ['cannot be read', { ok: false, err: 'error' }],
  ])('renders the document without the link when the finding %s', async (_name, response) => {
    const { wrapper } = await renderLink(response);

    expect(wrapper.find('[data-test-subj="findingLink"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('docId');
    expect(wrapper.find('EuiIconTip').exists()).toBe(true);
  });
});
