/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';

jest.mock('../../../services', () => {
  const services = jest.requireActual('../../../services/services');
  return {
    ...services,
    NotificationService: function NotificationServiceMock() {},
    getUseUpdatedUx: jest.fn(() => false),
  };
});

jest.mock('../../utils/helpers', () => {
  const helpers = jest.requireActual('../../utils/helpers');
  return {
    ...helpers,
    getIsAgentConfigured: jest.fn().mockResolvedValue(false),
  };
});

import Dashboard from './Dashboard';
import DashboardClassic from './DashboardClassic';
import { historyMock, httpClientMock } from '../../../../test/mocks';
import { setupCoreStart } from '../../../../test/utils/helpers';

const location = {
  hash: '',
  search: '',
  state: undefined,
};

beforeAll(() => {
  setupCoreStart();
});

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    httpClientMock.get.mockResolvedValue({
      ok: true,
      alerts: [],
      totalAlerts: 0,
      resp: { totalAlerts: 0, alerts: [] },
    });
  });

  const render = (props = {}) =>
    shallow(
      <Dashboard httpClient={httpClientMock} history={historyMock} location={location} {...props} />
    );

  test('renders DashboardClassic', () => {
    const wrapper = render({ perAlertView: true });

    expect(wrapper.find(DashboardClassic).exists()).toBe(true);
  });

  test('forwards props to the rendered dashboard', () => {
    const perAlertView = false;

    const wrapper = shallow(
      <Dashboard
        httpClient={httpClientMock}
        history={historyMock}
        location={location}
        perAlertView={perAlertView}
        monitorIds={['monitor-1']}
      />
    );

    const renderedDashboard = wrapper.find(DashboardClassic);
    expect(renderedDashboard.exists()).toBe(true);
    expect(renderedDashboard.prop('perAlertView')).toBe(perAlertView);
    expect(renderedDashboard.prop('monitorIds')).toEqual(['monitor-1']);
  });

  // Wazuh: the Document column opens the finding of the alert, which is only stored when the
  // alerting findings are enabled.
  test.each([
    [true, true],
    [false, false],
  ])(
    'shows the Document column of a per document monitor when findings are enabled: %s',
    (alertFindingEnabled, hasDocumentColumn) => {
      const wrapper = shallow(
        <DashboardClassic
          httpClient={httpClientMock}
          history={historyMock}
          location={location}
          notifications={{}}
          perAlertView={true}
          monitorType="doc_level_monitor"
          monitorIds={['monitorId']}
        />
      );
      wrapper.setState({ alertFindingEnabled });

      const columnNames = wrapper
        .find('EuiBasicTable')
        .prop('columns')
        .map(({ name }) => name);
      expect(columnNames.includes('Document')).toBe(hasDocumentColumn);
    }
  );
});
