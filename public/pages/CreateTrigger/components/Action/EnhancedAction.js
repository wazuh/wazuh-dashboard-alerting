/*
 * Copyright Wazuh Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import _ from 'lodash';
import {
  EuiAccordion,
  EuiBadge,
  EuiCompressedFormRow,
  EuiSmallButton,
  EuiHorizontalRule,
  EuiPanel,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiSmallButtonIcon,
  EuiSmallButtonEmpty,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiLoadingSpinner,
} from '@elastic/eui';
import { FormikFieldText, FormikComboBox } from '../../../../components/FormControls';
import { isInvalid, hasError, validateActionName } from '../../../../utils/validate';
import { validateDestination } from './utils/enhanced-validate';
import {
  DEFAULT_ACTION_TYPE,
  webhookNotificationActionMessageComponent,
  defaultNotificationActionMessageComponent,
  activeResponseActionMessageComponent,
} from '../../utils/constants';
import NotificationsCallOut from '../NotificationsCallOut';
import MinimalAccordion from '../../../../components/FeatureAnywhereContextMenu/MinimalAccordion';
import { getActionTypeFromAction, getManageChannelsUrl } from '../../../../utils/helpers';
import { MANAGED_CHANNEL_CATEGORY } from '../../../../utils/constants';
import { isManagedChannelType } from '../../../../services/utils/helper';
import {
  ACTION_FIELD_WIDTH,
  ACTIVE_RESPONSE_LOCATION,
  ACTIVE_RESPONSE_LOCATION_LABEL,
  ACTIVE_RESPONSE_TYPE_LABEL,
} from './utils/constants';

/*
 * EuiComboBox renders its list with a fixed row height, so anything taller than rowHeight
 * is cut off by the next row. The active response row is built from these fixed pieces and its
 * height is derived from them. The badges are laid out with flex, not as inline blocks, so they
 * do not leak below the text baseline.
 */
const OPTION_NAME_HEIGHT = 20;
const OPTION_BADGES_HEIGHT = 20; // an EuiBadge is 18px of line height plus its 1px borders
const OPTION_LINE_GAP = 6;
const OPTION_VERTICAL_SPACE = 9; // the row's 4px + 4px padding and its 1px bottom border
const OPTION_BREATHING_ROOM = 6;
const ACTIVE_RESPONSE_ROW_HEIGHT =
  OPTION_NAME_HEIGHT +
  OPTION_LINE_GAP +
  OPTION_BADGES_HEIGHT +
  OPTION_VERTICAL_SPACE +
  OPTION_BREATHING_ROOM;
const CHANNEL_ROW_HEIGHT = 46;

// An active response is only safe to arm once its target and mute state are visible
const renderActiveResponseOption = ({ label, isEnabled, activeResponse = {} }) => {
  const { type, location } = activeResponse;
  const locationLabel = ACTIVE_RESPONSE_LOCATION_LABEL[location];
  const typeLabel = ACTIVE_RESPONSE_TYPE_LABEL[type];
  const badges = [
    locationLabel && {
      label: locationLabel,
      color: location === ACTIVE_RESPONSE_LOCATION.ALL ? 'warning' : 'default',
    },
    typeLabel && { label: typeLabel, color: 'default' },
    isEnabled === false && { label: 'Muted · will not run', color: 'danger' },
  ].filter(Boolean);

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      <div className="eui-textTruncate" style={{ lineHeight: `${OPTION_NAME_HEIGHT}px` }}>
        {label}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          height: `${OPTION_BADGES_HEIGHT}px`,
          marginTop: `${OPTION_LINE_GAP}px`,
          overflow: 'hidden',
        }}
      >
        {badges.map(({ label: badgeLabel, color }) => (
          <EuiBadge key={badgeLabel} color={color} style={{ flex: '0 0 auto' }}>
            {badgeLabel}
          </EuiBadge>
        ))}
      </div>
    </div>
  );
};

const Action = ({
  action,
  arrayHelpers,
  context,
  destinations,
  flattenedDestinations,
  index,
  onDelete,
  sendTestMessage,
  setFlyout,
  fieldPath,
  values,
  hasNotificationPlugin,
  loadDestinations,
  flyoutMode,
  accordionProps = {},
  isInitialLoading,
}) => {
  const [backupValues, setBackupValues] = useState();
  const [isConfigureOpen, setIsConfigureOpen] = useState(false);
  const ManageButton = useMemo(
    () => (flyoutMode ? EuiSmallButtonEmpty : EuiSmallButton),
    [flyoutMode]
  );
  const Accordion = useMemo(() => (flyoutMode ? MinimalAccordion : EuiAccordion), [flyoutMode]);
  const [loadingDestinations, setLoadingDestinations] = useState(false);
  const selectedDestination = flattenedDestinations.filter(
    (item) => item.value === action.destination_id
  );
  const type = _.get(selectedDestination, '0.type', DEFAULT_ACTION_TYPE);

  const actionType = getActionTypeFromAction(action);
  const isActiveResponse = actionType === MANAGED_CHANNEL_CATEGORY.ACTIVE_RESPONSE;
  const { name } = action;
  let ActionComponent;
  const actionLabelNotification = 'Notification';
  const actionLabelActiveResponse = 'Active response';
  const actionLabelText = isActiveResponse ? actionLabelActiveResponse : actionLabelNotification;

  if (actionType === MANAGED_CHANNEL_CATEGORY.NOTIFICATION) {
    if (type === 'webhook') {
      ActionComponent = webhookNotificationActionMessageComponent;
    } else {
      ActionComponent = defaultNotificationActionMessageComponent;
    }
  } else if (isActiveResponse) {
    // Wazuh: active response action type
    ActionComponent = activeResponseActionMessageComponent;
  }

  const isFirstAction = index !== undefined && index === 0;
  const refreshDestinations = useMemo(() => {
    const refresh = async () => {
      setLoadingDestinations(true);
      await loadDestinations();
      setLoadingDestinations(false);
    };
    return _.debounce(refresh, 2000, { leading: true, trailing: false });
  }, []);
  const onConfigureOpen = () => {
    setIsConfigureOpen(true);
    setBackupValues(_.cloneDeep(values));
  };
  // Reset the form, because the user wants to restore the backup settings,
  // rather than just close the popup and keep the changes they have made.
  const onConfigureCancel = () => {
    setIsConfigureOpen(false);
    arrayHelpers.form.resetForm({ values: backupValues });
  };
  // Close and retain changes if no errors related to the fields involved
  const onConfigureUpdate = async () => {
    const errors = await arrayHelpers.form.validateForm();

    if (Object.keys(errors).length === 0) {
      setIsConfigureOpen(false);
      return;
    }

    const pathsToFields = ['subject_template.source', 'message_template.source'];

    // Mark fields in popup as touched
    pathsToFields.forEach((path) =>
      arrayHelpers.form.setFieldTouched(`${fieldPath}actions[${index}].${path}`)
    );

    const isErrorInConfigure = pathsToFields.find((path) =>
      _.get(errors, `${fieldPath}actions[${index}].${path}`, '')
    );

    if (!isErrorInConfigure) {
      setIsConfigureOpen(false);
    }
  };

  const renderChannels = () => {
    let placeHolderText = '';
    let dropdownLabelText = '';
    let options = [];
    if (actionType === MANAGED_CHANNEL_CATEGORY.NOTIFICATION) {
      placeHolderText = 'Select channel to notify';
      dropdownLabelText = 'Channel';
      options = destinations.filter((dest) => !isManagedChannelType(dest.key));
    } else if (isActiveResponse) {
      placeHolderText = 'Select active response to execute';
      dropdownLabelText = 'Active response';
      // The list holds nothing but active responses, so its group heading would only add an
      // empty row as tall as a real option
      options = destinations
        .filter((dest) => dest.key === MANAGED_CHANNEL_CATEGORY.ACTIVE_RESPONSE)
        .flatMap((group) => group.options);
    }
    return (
      <div>
        <EuiFlexGroup wrap alignItems="flexStart" gutterSize="s">
          <EuiFlexItem grow={false} style={{ width: ACTION_FIELD_WIDTH }}>
            <FormikComboBox
              name={`${fieldPath}actions.${index}.destination_id`}
              formRow
              fieldProps={{
                validate: validateDestination(flattenedDestinations, flyoutMode, actionType),
              }}
              rowProps={{
                label: dropdownLabelText,
                fullWidth: true,
                isInvalid,
                error: hasError,
              }}
              inputProps={{
                placeholder: placeHolderText,
                fullWidth: true,
                options: options,
                selectedOptions: selectedDestination,
                isDisabled: !hasNotificationPlugin,
                onChange: (options) => {
                  // Just a swap correct fields.
                  arrayHelpers.replace(index, {
                    ...action,
                    destination_id: options[0]?.value,
                  });
                },
                onBlur: (e, field, form) => {
                  refreshDestinations();
                  form.setFieldTouched(`${fieldPath}actions.${index}.destination_id`, true);
                },
                onFocus: refreshDestinations,
                singleSelection: { asPlainText: true },
                isClearable: true,
                'data-test-subj': 'channelComboBox',
                renderOption: (option) =>
                  isActiveResponse ? (
                    renderActiveResponseOption(option)
                  ) : (
                    <div style={{ lineHeight: '1' }}>
                      <EuiText size="s">{option.label}</EuiText>
                      {option.description && (
                        <EuiText size="xs" color="subdued">
                          {option.description}
                        </EuiText>
                      )}
                    </div>
                  ),
                rowHeight: isActiveResponse ? ACTIVE_RESPONSE_ROW_HEIGHT : CHANNEL_ROW_HEIGHT,
                isLoading: !flyoutMode && loadingDestinations,
              }}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            {/* The empty label keeps the button level with the input, whatever is below it */}
            <EuiCompressedFormRow hasEmptyLabelSpace>
              <ManageButton
                disabled={!hasNotificationPlugin}
                iconType="popout"
                iconSide="right"
                onClick={() => window.open(getManageChannelsUrl(actionType))}
              >
                {isActiveResponse ? 'Manage active responses' : 'Manage channels'}
              </ManageButton>
            </EuiCompressedFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="m" />
        {!hasNotificationPlugin && <NotificationsCallOut />}
      </div>
    );
  };

  return (
    <div style={flyoutMode ? {} : { paddingTop: isFirstAction ? undefined : '20px' }}>
      <EuiPanel
        styles={{ backgroundColor: '#FFFFFF' }}
        hasBorder={!flyoutMode}
        hasShadow={!flyoutMode}
        paddingSize={flyoutMode ? 'none' : 'm'}
      >
        <Accordion
          {...(flyoutMode
            ? {
                id: name,
                title: name,
                extraAction: (
                  <EuiSmallButtonIcon
                    iconType="trash"
                    color="text"
                    aria-label={`Delete ${actionLabelText.toLowerCase()} action`}
                    onClick={onDelete}
                  />
                ),
                ...accordionProps,
              }
            : {
                id: name,
                initialIsOpen: !name,
                className: 'accordion-action',
                buttonContent: (
                  <EuiText>
                    {!_.get(selectedDestination, '0.type', undefined)
                      ? actionLabelText
                      : `${actionLabelText}: ${name}`}
                  </EuiText>
                ),
                extraAction: (
                  // Matches the flyout variant instead of a full-size danger button
                  <EuiSmallButtonIcon
                    iconType="trash"
                    color="text"
                    aria-label={`Remove ${actionLabelText.toLowerCase()} action`}
                    onClick={onDelete}
                  />
                ),
                paddingSize: 's',
              })}
        >
          {!flyoutMode && <EuiHorizontalRule margin="s" />}
          <div
            style={
              flyoutMode ? {} : { paddingLeft: '20px', paddingRight: '20px', paddingTop: '10px' }
            }
          >
            {!flyoutMode && (
              <>
                <FormikFieldText
                  name={`${fieldPath}actions.${index}.name`}
                  formRow
                  fieldProps={{
                    validate: validateActionName(context.ctx.monitor, context.ctx.trigger),
                  }}
                  rowProps={{
                    label: 'Action name',
                    isInvalid,
                    error: hasError,
                  }}
                  inputProps={{
                    placeholder: 'Enter action name',
                    isInvalid,
                  }}
                />
                <EuiSpacer size="m" />
              </>
            )}
            {(!flyoutMode || !isInitialLoading) && renderChannels()}
            {flyoutMode && isInitialLoading && <EuiLoadingSpinner size="l" />}
            {!flyoutMode && (
              <ActionComponent
                action={action}
                context={context}
                selectedDestination={selectedDestination[0]}
                index={index}
                sendTestMessage={sendTestMessage}
                setFlyout={setFlyout}
                fieldPath={fieldPath}
                values={values}
              />
            )}
            {flyoutMode && !isInitialLoading && !isActiveResponse && (
              <>
                <EuiSmallButtonEmpty iconType="pencil" iconSide="left" onClick={onConfigureOpen}>
                  Configure
                </EuiSmallButtonEmpty>
                {isConfigureOpen && (
                  <EuiModal onClose={onConfigureCancel}>
                    <EuiModalHeader>
                      <EuiModalHeaderTitle>
                        <h1>Configure</h1>
                      </EuiModalHeaderTitle>
                    </EuiModalHeader>
                    <EuiModalBody>
                      <ActionComponent
                        action={action}
                        context={context}
                        index={index}
                        sendTestMessage={sendTestMessage}
                        setFlyout={setFlyout}
                        fieldPath={fieldPath}
                        values={values}
                      />
                    </EuiModalBody>
                    <EuiModalFooter>
                      <EuiSmallButton onClick={onConfigureCancel}>Cancel</EuiSmallButton>
                      <EuiSmallButton onClick={onConfigureUpdate} fill>
                        Update
                      </EuiSmallButton>
                    </EuiModalFooter>
                  </EuiModal>
                )}
              </>
            )}
          </div>
        </Accordion>
        {flyoutMode && <EuiHorizontalRule margin="s" />}
      </EuiPanel>
    </div>
  );
};

export default Action;
