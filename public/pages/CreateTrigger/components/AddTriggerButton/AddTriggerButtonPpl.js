/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import _ from 'lodash';
import { EuiButton } from '@elastic/eui';
import { FORMIK_INITIAL_TRIGGER_VALUES } from '../../containers/CreateTrigger/utils/constants';
import EnhancedAccordion from '../../../../components/FeatureAnywhereContextMenu/EnhancedAccordion';
import { getInitialPplTriggerValues } from './utils';

// Keep the focused query field from blurring on mousedown. The blur validates the field and
// shifts the layout, so the button moves before mouseup and the first click is lost.
const keepFieldFocus = (e) => e.preventDefault();

const AddTriggerButtonPpl = ({
  arrayHelpers,
  disabled,
  script = FORMIK_INITIAL_TRIGGER_VALUES.script,
  flyoutMode,
  onPostAdd,
}) => {
  const triggers = _.get(arrayHelpers, 'form.values.triggerDefinitions', []);
  const buttonText =
    _.get(arrayHelpers, 'form.values.triggerDefinitions', []).length === 0
      ? 'Add trigger'
      : 'Add another trigger';
  const onClick = () => {
    const values = getInitialPplTriggerValues({ script, flyoutMode, triggers });
    arrayHelpers.push(values);

    if (flyoutMode && onPostAdd) {
      onPostAdd(values);
    }
  };

  if (flyoutMode) {
    return (
      <EnhancedAccordion
        {...{
          id: 'addTrigger',
          isOpen: false,
          isButton: true,
          iconType: 'plusInCircle',
          onToggle: onClick,
          title: 'Add trigger',
        }}
      />
    );
  }

  return (
    <EuiButton
      fill={false}
      size={'s'}
      onClick={onClick}
      onMouseDown={keepFieldFocus}
      disabled={disabled}
    >
      {buttonText}
    </EuiButton>
  );
};

export default AddTriggerButtonPpl;
