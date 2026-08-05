/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Formik } from 'formik';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';

import { FORMIK_INITIAL_VALUES } from '../CreateMonitor/utils/constants';
import MonitorIndex from './MonitorIndex';
import * as helpers from './utils/helpers';
import { httpClientMock } from '../../../../../test/mocks';
import { MONITOR_TYPE } from '../../../../utils/constants';

helpers.createReasonableWait = jest.fn((cb) => cb());

// Enzyme's change event is synchronous and Formik's handlers are asynchronous
// https://github.com/formium/formik/issues/937, https://www.benmvp.com/blog/asynchronous-testing-with-enzyme-react-jest/
const runAllPromises = () => new Promise(setImmediate);

let formikProps;

function getMountWrapper(customProps = {}) {
  return mount(
    // `validateOnChange` is disabled to match the monitor form, see CreateMonitor.
    <Formik initialValues={FORMIK_INITIAL_VALUES} validateOnChange={false}>
      {(props) => {
        formikProps = props;
        return <MonitorIndex httpClient={httpClientMock} {...customProps} />;
      }}
    </Formik>
  );
}

// The combo box applies typed text through a native `focusout` listener on its container, which
// Enzyme's synthetic `simulate('blur')` does not reach.
function blurComboBox(wrapper) {
  const comboBox = wrapper.find('[data-test-subj="indicesComboBox"]').hostNodes().getDOMNode();
  act(() => {
    comboBox.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
  });
  wrapper.update();
}

function typeInComboBox(wrapper, value) {
  wrapper
    .find('[data-test-subj="comboBoxSearchInput"]')
    .hostNodes()
    .simulate('change', { target: { value } });
}

describe('MonitorIndex', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // `clearMocks` only clears calls, so the response has to be restored to keep tests isolated.
    httpClientMock.post.mockResolvedValue({ ok: true, resp: [] });
  });
  test('renders', () => {
    const wrapper = getMountWrapper();
    expect(wrapper).toMatchSnapshot();
  });

  test('calls onSearchChange when changing input value', () => {
    const onSearchChange = jest.spyOn(MonitorIndex.prototype, 'onSearchChange');
    const wrapper = getMountWrapper();
    wrapper
      .find('[data-test-subj="comboBoxSearchInput"]')
      .hostNodes()
      .simulate('change', { target: { value: 'random-index' } });

    expect(onSearchChange).toHaveBeenCalled();
    expect(onSearchChange).toHaveBeenCalledWith('random-index', false);
  });

  test('appends wildcard when search is one valid character', () => {
    const wrapper = getMountWrapper();

    wrapper
      .find('[data-test-subj="comboBoxSearchInput"]')
      .hostNodes()
      .simulate('change', { target: { value: 'r' } });

    expect(wrapper.find(MonitorIndex).instance().state.appendedWildcard).toBe(true);
    expect((wrapper.find(MonitorIndex).instance().lastQuery = 'r*'));
  });

  test('searches space normalizes value', () => {
    const wrapper = getMountWrapper();

    wrapper
      .find('[data-test-subj="comboBoxSearchInput"]')
      .hostNodes()
      .simulate('change', { target: { value: ' ' } })
      .simulate('keyDown', { key: 'Enter' });

    expect(wrapper.find('.euiComboBoxPill')).toHaveLength(0);
  });

  test('searches resets appendedWildcard', () => {
    const wrapper = getMountWrapper();

    wrapper
      .find('[data-test-subj="comboBoxSearchInput"]')
      .hostNodes()
      .simulate('change', { target: { value: 'r' } });

    expect(wrapper.find(MonitorIndex).instance().state.appendedWildcard).toBe(true);
    expect((wrapper.find(MonitorIndex).instance().lastQuery = 'r*'));

    wrapper
      .find('[data-test-subj="comboBoxSearchInput"]')
      .hostNodes()
      .simulate('change', { target: { value: '*' } });

    expect(wrapper.find(MonitorIndex).instance().state.appendedWildcard).toBe(false);
    expect((wrapper.find(MonitorIndex).instance().lastQuery = ''));
  });

  test('returns empty alias/index array for *:', async () => {
    const wrapper = getMountWrapper();

    expect(await wrapper.find(MonitorIndex).instance().handleQueryAliases('*:')).toEqual([]);
    expect((await wrapper.find(MonitorIndex).instance().handleQueryIndices('*:')).indices).toEqual(
      []
    );
  });

  test('returns empty array for data.ok = false', async () => {
    httpClientMock.post.mockResolvedValue({ ok: false });
    const wrapper = getMountWrapper();

    expect(await wrapper.find(MonitorIndex).instance().handleQueryAliases('random')).toEqual([]);
    expect(
      (await wrapper.find(MonitorIndex).instance().handleQueryIndices('random')).indices
    ).toEqual([]);
  });
  //
  test('returns indices/aliases', async () => {
    httpClientMock.post.mockResolvedValue({
      ok: true,
      resp: [{ health: 'green', status: 'open', index: 'logstash-0', alias: 'logstash' }],
    });
    const wrapper = getMountWrapper();

    expect(await wrapper.find(MonitorIndex).instance().handleQueryAliases('l')).toEqual([
      { label: 'logstash', index: 'logstash-0' },
    ]);
    expect((await wrapper.find(MonitorIndex).instance().handleQueryIndices('l')).indices).toEqual([
      { health: 'green', status: 'open', label: 'logstash-0' },
    ]);
  });

  test('onBlur sets index to touched', async () => {
    httpClientMock.post.mockResolvedValue({
      ok: true,
      resp: [{ health: 'green', status: 'open', index: 'logstash-0', alias: 'logstash' }],
    });
    const wrapper = getMountWrapper();

    typeInComboBox(wrapper, 'l');
    await runAllPromises();
    blurComboBox(wrapper);

    expect(formikProps.touched).toEqual({ index: true });
  });

  test('sets option when calling onCreateOption', async () => {
    httpClientMock.post.mockResolvedValue({
      ok: true,
      resp: [{ health: 'green', status: 'open', index: 'logstash-0', alias: 'logstash' }],
    });
    const wrapper = getMountWrapper();

    wrapper
      .find('[data-test-subj="comboBoxSearchInput"]')
      .hostNodes()
      .simulate('change', { target: { value: 'logstash-0' } });

    await runAllPromises();

    wrapper
      .find('[data-test-subj="comboBoxInput"]')
      .hostNodes()
      .simulate('keyDown', { key: 'ArrowDown' })
      .simulate('keyDown', { key: 'Enter' });

    // Validate the specific index is in the input field
    expect(wrapper.find('[data-test-subj="comboBoxInput"]').text()).toEqual(
      'logstash-0EuiIconMock'
    );
  });

  test('applies the typed index on blur', async () => {
    const wrapper = getMountWrapper({ monitorType: MONITOR_TYPE.DOC_LEVEL });

    // Leaving the field without an index reports the error.
    blurComboBox(wrapper);
    await runAllPromises();
    expect(formikProps.errors.index).toBe('Must specify an index.');

    typeInComboBox(wrapper, 'logstash-0');
    await runAllPromises();
    blurComboBox(wrapper);
    await runAllPromises();

    expect(formikProps.values.index).toEqual([{ label: 'logstash-0' }]);
    // The error of the index that was replaced must not survive the blur.
    expect(formikProps.errors.index).toBeUndefined();
    // The typed text is applied, so the search input no longer holds it.
    expect(wrapper.find('[data-test-subj="comboBoxSearchInput"]').hostNodes().prop('value')).toBe(
      ''
    );
  });

  describe('Active Response monitors', () => {
    // Only this index exists, so the queries of any other one come back empty.
    const EXISTING_INDEX = 'wazuh-findings-v5-000001';

    beforeEach(() => {
      httpClientMock.post.mockImplementation((url, { body }) => {
        const { index, alias } = JSON.parse(body);
        const query = index || alias;
        const matches = query.endsWith('*')
          ? EXISTING_INDEX.startsWith(query.slice(0, -1))
          : EXISTING_INDEX === query;
        const resp =
          matches && !url.includes('_aliases')
            ? [{ health: 'green', status: 'open', index: EXISTING_INDEX }]
            : [];
        return Promise.resolve({ ok: true, resp });
      });
    });

    const typeAndBlur = async (wrapper, value) => {
      typeInComboBox(wrapper, value);
      await runAllPromises();
      blurComboBox(wrapper);
      await runAllPromises();
      // The typed index is always applied, so that it is never taken for a discarded one.
      expect(formikProps.values.index.map(({ label }) => label)).toEqual([value]);
    };

    test('reject the indices they cannot run over', async () => {
      const wrapper = getMountWrapper({ monitorType: MONITOR_TYPE.ACTIVE_RESPONSE });

      await typeAndBlur(wrapper, 'logstash-0');
      expect(formikProps.errors.index).toMatch('can only use Wazuh findings indices');

      await typeAndBlur(wrapper, 'wazuh-findings-v5-*');
      expect(formikProps.errors.index).toMatch('Index patterns are not supported');

      await typeAndBlur(wrapper, 'wazuh-findings-v5-000009');
      expect(formikProps.errors.index).toMatch('Index not found');

      await typeAndBlur(wrapper, EXISTING_INDEX);
      expect(formikProps.errors.index).toBeUndefined();
    });

    test('clear the error when an index is picked from the options', async () => {
      const wrapper = getMountWrapper({ monitorType: MONITOR_TYPE.ACTIVE_RESPONSE });

      await typeAndBlur(wrapper, 'wazuh-findings-v5-000009');
      expect(formikProps.errors.index).toMatch('Index not found');

      // Picking an index has to report on its own, the form does not validate on change.
      wrapper.find('EuiCompressedComboBox').prop('onChange')([{ label: EXISTING_INDEX }]);
      await runAllPromises();

      expect(formikProps.values.index).toEqual([{ label: EXISTING_INDEX }]);
      expect(formikProps.errors.index).toBeUndefined();
    });
  });
});
