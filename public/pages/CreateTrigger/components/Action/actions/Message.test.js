/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, shallow, mount } from 'enzyme';
import { Formik } from 'formik';
import Message from './Message';
import Mustache from 'mustache';
import { MONITOR_TYPE } from '../../../../../utils/constants';

jest.mock('@elastic/eui/lib/components/form/form_row/make_id', () => () => 'testing-id');

function getRenderWrapper(customProps = {}) {
  return render(
    <Formik>
      {() => (
        <Message
          action={{
            message_template: {
              source:
                'Monitor {{ctx.monitor.name}} just entered alert status. Please investigate the issue.\n- Trigger: {{ctx.trigger.name}}\n- Severity: {{ctx.trigger.severity}}\n- Period start: {{ctx.periodStart}} UTC\n- Period end: {{ctx.periodEnd}} UTC',
              lang: 'mustache',
            },
          }}
          context={{}}
          index={0}
          {...customProps}
          sendTestMessage={jest.fn()}
          setFlyout={jest.fn()}
        />
      )}
    </Formik>
  );
}

describe('Message', () => {
  test('renders', () => {
    const wrapper = getRenderWrapper();
    expect(wrapper).toMatchSnapshot();
  });

  test('offers the finding variables for per document monitors over findings only', () => {
    const variablesButton = '[data-test-subj="insertMessageVariableButton"]';
    const docLevelContext = (indices, monitorType = MONITOR_TYPE.DOC_LEVEL) => ({
      ctx: {
        monitor: {
          monitor_type: monitorType,
          inputs: [{ doc_level_input: { indices } }],
        },
      },
    });

    expect(
      getRenderWrapper({ context: docLevelContext(['wazuh-findings-v5-security']) }).find(
        variablesButton
      )
    ).toHaveLength(1);
    expect(
      getRenderWrapper({
        context: docLevelContext(['wazuh-findings-v5-security'], MONITOR_TYPE.ACTIVE_RESPONSE),
      }).find(variablesButton)
    ).toHaveLength(1);
    expect(
      getRenderWrapper({ context: docLevelContext(['logs-*']) }).find(variablesButton)
    ).toHaveLength(0);
    expect(getRenderWrapper().find(variablesButton)).toHaveLength(0);
  });

  test('performs the actions of active response monitors per alert only', () => {
    const wrapper = getRenderWrapper({
      context: { ctx: { monitor: { monitor_type: MONITOR_TYPE.ACTIVE_RESPONSE } } },
    });

    expect(wrapper.find('input[value="per_alert"]').attr('checked')).toBe('checked');
    expect(wrapper.find('input[value="per_execution"]').attr('disabled')).toBe('disabled');
  });

  test('sizes the message box to the message for per document monitors only', () => {
    const docLevelContext = { ctx: { monitor: { monitor_type: MONITOR_TYPE.DOC_LEVEL } } };

    expect(getRenderWrapper({ context: docLevelContext }).find('textarea').attr('rows')).toBe('5');
    expect(getRenderWrapper().find('textarea').attr('rows')).toBe('3');
  });

  test('tells which dashboard address the finding links use', () => {
    const linkNote = 'Links to findings use http://localhost.';
    const findingLinkAction = {
      message_template: {
        source:
          'View: http://localhost/app/discover#/doc/wazuh-findings-v5%2A/{{_index}}?id={{_id}}',
        lang: 'mustache',
      },
    };

    expect(getRenderWrapper({ action: findingLinkAction }).text()).toContain(linkNote);
    expect(getRenderWrapper().text()).not.toContain(linkNote);
  });
});
