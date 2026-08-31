/*
 * Copyright Wazuh Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount } from 'enzyme';

import ActiveResponseSummary from './ActiveResponseSummary';
import { ACTIVE_RESPONSE_LOCATION, ACTIVE_RESPONSE_TYPE } from '../utils/constants';

jest.mock('../../../../../services', () => ({
  ...jest.requireActual('../../../../../services'),
  getUseUpdatedUx: () => false,
}));

const localResponse = {
  isEnabled: true,
  activeResponse: {
    executable: 'block-ip',
    extra_args: '--timeout 30',
    type: ACTIVE_RESPONSE_TYPE.STATEFUL,
    stateful_timeout: 30,
    location: ACTIVE_RESPONSE_LOCATION.LOCAL,
  },
};

const getText = (selectedDestination) =>
  mount(<ActiveResponseSummary selectedDestination={selectedDestination} />).text();

describe('ActiveResponseSummary', () => {
  test('renders nothing until an active response is selected', () => {
    expect(mount(<ActiveResponseSummary />).isEmptyRender()).toBe(true);
    expect(mount(<ActiveResponseSummary selectedDestination={{}} />).isEmptyRender()).toBe(true);
  });

  test('summarizes the executable, type and location', () => {
    const text = getText(localResponse);

    expect(text).toContain('block-ip --timeout 30');
    expect(text).toContain('Stateful · reverted after 30 seconds');
    expect(text).toContain('Local');
  });

  test('names the agent when the response targets a defined agent', () => {
    const text = getText({
      ...localResponse,
      activeResponse: {
        ...localResponse.activeResponse,
        location: ACTIVE_RESPONSE_LOCATION.DEFINED_AGENT,
        agent_id: '003',
      },
    });

    expect(text).toContain('Defined agent · 003');
  });

  test('warns when the response runs on every agent', () => {
    const text = getText({
      ...localResponse,
      activeResponse: { ...localResponse.activeResponse, location: ACTIVE_RESPONSE_LOCATION.ALL },
    });

    expect(text).toContain('Runs on every agent in the environment');
  });

  test('warns when the response is muted', () => {
    const wrapper = mount(
      <ActiveResponseSummary selectedDestination={{ ...localResponse, isEnabled: false }} />
    );

    expect(wrapper.text()).toContain('This response is muted');
    expect(wrapper.find('a').first().props().href).toContain('active-responses');
  });

  test('does not warn when the response is local and enabled', () => {
    const text = getText(localResponse);

    expect(text).not.toContain('Runs on every agent in the environment');
    expect(text).not.toContain('This response is muted');
  });
});
