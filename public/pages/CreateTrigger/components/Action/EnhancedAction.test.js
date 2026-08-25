/*
 * Copyright Wazuh Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount } from 'enzyme';
import { Formik } from 'formik';

import EnhancedAction from './EnhancedAction';
import { MANAGED_CHANNEL_CATEGORY } from '../../../../utils/constants';
import { ACTIVE_RESPONSE_LOCATION, ACTIVE_RESPONSE_TYPE } from './utils/constants';

jest.mock('../../../../services', () => ({
  ...jest.requireActual('../../../../services'),
  getUseUpdatedUx: () => false,
}));

const activeResponse = (overrides = {}) => ({
  label: 'Isolate-compromised-host',
  value: 'config-id',
  type: MANAGED_CHANNEL_CATEGORY.ACTIVE_RESPONSE,
  isEnabled: true,
  activeResponse: {
    executable: 'host-deny',
    extra_args: '',
    type: ACTIVE_RESPONSE_TYPE.STATELESS,
    location: ACTIVE_RESPONSE_LOCATION.LOCAL,
  },
  ...overrides,
});

const getWrapper = (option) => {
  const destinations = [
    {
      key: MANAGED_CHANNEL_CATEGORY.ACTIVE_RESPONSE,
      label: 'Active responses',
      options: [{ key: option.value, ...option }],
    },
  ];

  return mount(
    <Formik initialValues={{}}>
      {() => (
        <EnhancedAction
          action={{ id: 'activeResponse1', name: 'Isolate-action' }}
          arrayHelpers={{}}
          context={{ ctx: { monitor: {}, trigger: {} } }}
          destinations={destinations}
          flattenedDestinations={[option]}
          index={0}
          onDelete={() => {}}
          sendTestMessage={() => {}}
          setFlyout={() => {}}
          fieldPath=""
          values={{}}
          hasNotificationPlugin
          loadDestinations={() => {}}
        />
      )}
    </Formik>
  );
};

const getRenderedOption = (wrapper, option) => {
  const { renderOption } = wrapper.find('EuiCompressedComboBox').first().props();
  return mount(<div>{renderOption(option)}</div>);
};

describe('EnhancedAction', () => {
  test('shows the location and type of every active response', () => {
    const option = activeResponse();
    const text = getRenderedOption(getWrapper(option), option).text();

    expect(text).toContain('Isolate-compromised-host');
    expect(text).toContain('Local');
    expect(text).toContain('Stateless');
    expect(text).not.toContain('Muted');
  });

  test('badges a fleet-wide active response with the warning color', () => {
    const option = activeResponse({
      activeResponse: {
        ...activeResponse().activeResponse,
        location: ACTIVE_RESPONSE_LOCATION.ALL,
      },
    });
    const rendered = getRenderedOption(getWrapper(option), option);

    expect(rendered.text()).toContain('All agents');
    expect(rendered.find('EuiBadge').first().props().color).toBe('warning');
  });

  test('badges a muted active response as not running', () => {
    const option = activeResponse({ isEnabled: false });

    expect(getRenderedOption(getWrapper(option), option).text()).toContain('Muted · will not run');
  });

  test('offers active responses without a group heading row', () => {
    const option = activeResponse();
    const { options } = getWrapper(option).find('EuiCompressedComboBox').first().props();

    expect(options).toEqual([{ key: option.value, ...option }]);
  });

  test('lets the selected active response be cleared', () => {
    const wrapper = getWrapper(activeResponse());

    expect(wrapper.find('EuiCompressedComboBox').first().props().isClearable).toBe(true);
  });
});
