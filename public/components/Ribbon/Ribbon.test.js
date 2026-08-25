/*
 * Copyright Wazuh Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount } from 'enzyme';

import Ribbon from './Ribbon';

const items = [
  { key: 'executable', label: 'Executable', value: 'host-deny' },
  { key: 'location', label: 'Location', value: 'All agents' },
];

describe('Ribbon', () => {
  test('shows every item as a label over its value', () => {
    const text = mount(<Ribbon items={items} />).text();

    expect(text).toContain('Executable');
    expect(text).toContain('host-deny');
    expect(text).toContain('Location');
    expect(text).toContain('All agents');
  });

  test('falls back when an item has no value', () => {
    const wrapper = mount(<Ribbon items={[{ key: 'type', label: 'Type' }]} />);

    expect(wrapper.find('EuiStat').first().props().title).toBe('-');
  });
});
