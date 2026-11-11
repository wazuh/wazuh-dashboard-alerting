/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import AddTriggerButton from './AddTriggerButton';
import AddTriggerButtonPpl from './AddTriggerButtonPpl';

describe('AddTriggerButton', () => {
  test('renders', () => {
    const wrapper = shallow(<AddTriggerButton />);
    expect(wrapper).toMatchSnapshot();
  });

  test.each([
    ['AddTriggerButton', AddTriggerButton],
    ['AddTriggerButtonPpl', AddTriggerButtonPpl],
  ])('%s does not take focus from the active field on mousedown', (_name, Component) => {
    const arrayHelpers = { push: jest.fn(), form: { values: { triggerDefinitions: [] } } };
    const wrapper = shallow(<Component arrayHelpers={arrayHelpers} />);
    const preventDefault = jest.fn();

    wrapper.find('EuiButton').simulate('mouseDown', { preventDefault });
    expect(preventDefault).toHaveBeenCalled();

    wrapper.find('EuiButton').simulate('click');
    expect(arrayHelpers.push).toHaveBeenCalledTimes(1);
  });
});
