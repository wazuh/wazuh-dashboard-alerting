/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import { Formik } from 'formik';
import { httpServiceMock } from '../../../../../../../src/core/public/mocks';

import CreateMonitor from './CreateMonitor';
import { historyMock, httpClientMock } from '../../../../../test/mocks';
import { FORMIK_INITIAL_VALUES } from './utils/constants';
import { AlertingFakes, setupCoreStart } from '../../../../../test/utils/helpers';
import { MONITOR_TYPE, SEARCH_TYPE } from '../../../../utils/constants';
import { TRIGGER_TYPE } from '../../../CreateTrigger/containers/CreateTrigger/utils/constants';
import { setClient, setNotifications } from '../../../../services';
import { formikToMonitor } from './utils/formikToMonitor';
import coreMock from '../../../../../test/mocks/CoreMock';
import FindingsPresetCallOut from '../../components/FindingsPresetCallOut';
import FindingsPresetDiscardedCallOut from '../../components/FindingsPresetDiscardedCallOut';

const alertingFakes = new AlertingFakes('CreateMonitor random seed');

const setFlyout = jest.fn();
const updateMonitor = jest.fn().mockResolvedValue({ ok: true, id: 'monitor_id' });
const formikBag = {
  setSubmitting: jest.fn(),
  setErrors: jest.fn(),
};
const match = {
  isExact: true,
  params: {},
  path: '/create-monitor',
  url: '/create-monitor',
};
const location = {
  hash: '',
  pathname: '/create-monitor',
  search: '',
  state: undefined,
};

beforeAll(() => {
  setupCoreStart();
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CreateMonitor', () => {
  const httpClient = httpServiceMock.createStartContract();
  setClient(httpClient);
  setNotifications(coreMock.notifications);
  test('renders', () => {
    const wrapper = shallow(
      <CreateMonitor
        httpClient={httpClientMock}
        history={historyMock}
        setFlyout={setFlyout}
        match={match}
        location={location}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });

  test('uses AD query Params as initialValues when parameter exists', () => {
    const wrapper = shallow(
      <CreateMonitor
        httpClient={httpClientMock}
        history={historyMock}
        setFlyout={setFlyout}
        match={match}
        location={{ ...location, search: 'searchType=ad&adId=randomId&name=Sample' }}
      />
    );
    expect(wrapper.instance().state.initialValues.name).toBe('Sample-Monitor');
    expect(wrapper.instance().state.initialValues.searchType).toBe(SEARCH_TYPE.AD);
    expect(wrapper.instance().state.initialValues.detectorId).toBe('randomId');
  });

  // Wazuh
  describe('findings preset', () => {
    const presetLocation = { ...location, search: '?preset=findings&channelId=channel_id' };
    const flushPromises = () => new Promise((resolve) => setImmediate(resolve));
    const renderWithChannel = (getChannel, props = {}) =>
      shallow(
        <CreateMonitor
          httpClient={httpClientMock}
          history={historyMock}
          setFlyout={setFlyout}
          match={match}
          location={presetLocation}
          notificationService={{ getChannel }}
          {...props}
        />
      );

    test('holds the form until the channel is known, then fills it in', async () => {
      const getChannel = jest.fn().mockResolvedValue({ name: 'SOC Slack', is_enabled: true });
      const wrapper = renderWithChannel(getChannel);
      expect(wrapper.find('[data-test-subj="findingsPresetLoading"]')).toHaveLength(1);

      await flushPromises();

      const { initialValues, findingsPreset } = wrapper.instance().state;
      expect(getChannel).toHaveBeenCalledWith('channel_id');
      expect(findingsPreset).toMatchObject({
        channelId: 'channel_id',
        channelName: 'SOC Slack',
        channelMuted: false,
        loading: false,
      });
      expect(initialValues.name).toBe('SOC Slack: high and critical findings');
      expect(initialValues.monitor_type).toBe('doc_level_monitor');
      expect(initialValues.triggerDefinitions[0].actions[0].destination_id).toBe('channel_id');
      expect(wrapper.find('[data-test-subj="findingsPresetLoading"]')).toHaveLength(0);
    });

    test('flags a muted channel', async () => {
      const wrapper = renderWithChannel(
        jest.fn().mockResolvedValue({ name: 'SOC Slack', is_enabled: false })
      );

      await flushPromises();

      expect(wrapper.instance().state.findingsPreset.channelMuted).toBe(true);
    });

    test('leaves the channel empty when it was not found', async () => {
      const wrapper = renderWithChannel(jest.fn().mockRejectedValue(new Error('Not found')));

      await flushPromises();

      const { initialValues, findingsPreset } = wrapper.instance().state;
      expect(findingsPreset.channelName).toBeUndefined();
      expect(initialValues.name).toBe('High and critical findings');
      expect(initialValues.triggerDefinitions[0].actions[0].destination_id).toBe('');
    });

    test('offers to restore the preset when the monitor type changes', async () => {
      const wrapper = renderWithChannel(
        jest.fn().mockResolvedValue({ name: 'SOC Slack', is_enabled: true })
      );
      await flushPromises();
      const { initialValues } = wrapper.instance().state;
      const renderForm = (values, setValues = jest.fn()) =>
        wrapper.find(Formik).renderProp('children')({ values, errors: {}, touched: {}, setValues });

      const presetForm = renderForm(initialValues);
      expect(presetForm.find(FindingsPresetCallOut)).toHaveLength(1);
      expect(presetForm.find(FindingsPresetDiscardedCallOut)).toHaveLength(0);

      // What selecting the Per query monitor card leaves in the form, after a name change.
      const changedValues = {
        ...initialValues,
        name: 'Edited name',
        monitor_type: MONITOR_TYPE.QUERY_LEVEL,
        index: [],
        triggerDefinitions: [],
      };
      const setValues = jest.fn();
      const changedForm = renderForm(changedValues, setValues);
      expect(changedForm.find(FindingsPresetCallOut)).toHaveLength(0);

      changedForm.find(FindingsPresetDiscardedCallOut).prop('onRestore')();

      expect(setValues).toHaveBeenCalledWith({
        ...initialValues,
        name: 'Edited name',
      });
    });

    test('is ignored when editing a monitor', () => {
      const getChannel = jest.fn();
      const monitor = alertingFakes.randomMonitor();
      const wrapper = renderWithChannel(getChannel, {
        edit: true,
        monitorToEdit: monitor,
        updateMonitor,
      });

      expect(wrapper.instance().state.findingsPreset).toBeNull();
      expect(getChannel).not.toHaveBeenCalled();
      expect(wrapper.instance().state.initialValues.name).toBe(monitor.name);
    });
  });

  test('uses monitorToEdit as initialValues when editing', () => {
    const monitor = alertingFakes.randomMonitor();
    const wrapper = shallow(
      <CreateMonitor
        httpClient={httpClientMock}
        edit={true}
        history={historyMock}
        setFlyout={setFlyout}
        updateMonitor={updateMonitor}
        monitorToEdit={monitor}
        match={match}
        location={location}
      />
    );
    expect(wrapper.instance().state.initialValues.name).toBe(monitor.name);
  });

  /**
   * TODO: move these tests to helper.test.js as the new helper.js file has this logic now
  describe('onSubmit', () => {
    test('calls only onUpdate when editing', () => {
      const onCreate = jest.spyOn(CreateMonitor.prototype, 'onCreate');
      const onUpdate = jest.spyOn(CreateMonitor.prototype, 'onUpdate');
      const wrapper = shallow(
        <CreateMonitor
          httpClient={httpClientMock}
          edit={true}
          history={historyMock}
          setFlyout={setFlyout}
          updateMonitor={updateMonitor}
          monitorToEdit={null}
          match={match}
          location={location}
          notifications={coreMock.notifications}
        />
      );
      wrapper.instance().onSubmit(FORMIK_INITIAL_VALUES, formikBag);
      expect(onUpdate).toHaveBeenCalledTimes(1);
      expect(onCreate).not.toHaveBeenCalled();
    });

    test('calls only onCreate when creating', () => {
      const onCreate = jest.spyOn(CreateMonitor.prototype, 'onCreate');
      const onUpdate = jest.spyOn(CreateMonitor.prototype, 'onUpdate');
      httpClientMock.post.mockResolvedValue({ ok: true, resp: { _id: 'monitor_id' } });
      const wrapper = shallow(
        <CreateMonitor
          httpClient={httpClientMock}
          history={historyMock}
          setFlyout={setFlyout}
          match={match}
          location={location}
          notifications={coreMock.notifications}
        />
      );
      wrapper.instance().onSubmit(FORMIK_INITIAL_VALUES, formikBag);
      expect(onCreate).toHaveBeenCalledTimes(1);
      expect(onUpdate).not.toHaveBeenCalled();
    });
  });
  **/

  describe('onCancel', () => {
    test('calls history.goBack if editing', () => {
      const wrapper = shallow(
        <CreateMonitor
          httpClient={httpClientMock}
          edit={true}
          history={historyMock}
          setFlyout={setFlyout}
          updateMonitor={updateMonitor}
          monitorToEdit={null}
          match={match}
          location={location}
        />
      );
      wrapper.instance().onCancel();
      expect(historyMock.goBack).toHaveBeenCalledTimes(1);
      expect(historyMock.push).not.toHaveBeenCalled();
    });

    test('calls history.push when creating', () => {
      const wrapper = shallow(
        <CreateMonitor
          httpClient={httpClientMock}
          history={historyMock}
          setFlyout={setFlyout}
          match={match}
          location={location}
        />
      );
      wrapper.instance().onCancel();
      expect(historyMock.push).toHaveBeenCalledTimes(1);
      expect(historyMock.goBack).not.toHaveBeenCalled();
    });
  });

  describe('onUpdate', () => {
    // Query-level monitor
    test('calls updateMonitor with monitor', () => {
      // const monitor = alertingFakes.randomMonitor();
      // const trigger = alertingFakes.randomTrigger(TRIGGER_TYPE.QUERY_LEVEL);
      // monitor.triggers = [trigger];
      //
      // submitValuesToMonitor(FORMIK_INITIAL_VALUES, )
      const monitor = formikToMonitor(FORMIK_INITIAL_VALUES);
      const wrapper = shallow(
        <CreateMonitor
          httpClient={httpClientMock}
          edit={true}
          history={historyMock}
          setFlyout={setFlyout}
          updateMonitor={updateMonitor}
          monitorToEdit={null}
          match={match}
          location={location}
          notifications={coreMock.notifications}
        />
      );
      wrapper.instance().onSubmit(FORMIK_INITIAL_VALUES, formikBag);
      expect(updateMonitor).toHaveBeenCalledTimes(1);
      expect(updateMonitor).toHaveBeenCalledWith(monitor);
    });

    test('logs error when updateMonitor rejects', async () => {
      const error = jest.spyOn(global.console, 'error');
      updateMonitor.mockRejectedValue(new Error('updateMonitor error'));
      const wrapper = shallow(
        <CreateMonitor
          httpClient={httpClientMock}
          edit={true}
          history={historyMock}
          setFlyout={setFlyout}
          updateMonitor={updateMonitor}
          monitorToEdit={null}
          match={match}
          location={location}
          notifications={coreMock.notifications}
        />
      );
      await wrapper.instance().onSubmit(FORMIK_INITIAL_VALUES, formikBag);
      expect(error).toHaveBeenCalled();
    });

    test('logs resp when ok:false', async () => {
      const log = jest.spyOn(global.console, 'log');
      updateMonitor.mockResolvedValue({ ok: false, resp: 'test' });
      const wrapper = shallow(
        <CreateMonitor
          httpClient={httpClientMock}
          edit={true}
          history={historyMock}
          setFlyout={setFlyout}
          updateMonitor={updateMonitor}
          monitorToEdit={null}
          match={match}
          location={location}
          notifications={coreMock.notifications}
        />
      );
      await wrapper.instance().onSubmit(FORMIK_INITIAL_VALUES, formikBag);
      await new Promise((r) => setTimeout(r, 100));
      expect(log).toHaveBeenCalled();
      expect(log).toHaveBeenCalledWith('Failed to update:', { ok: false, resp: 'test' });
    });
  });

  describe('onCreate', () => {
    test('calls post with monitor', () => {
      const monitor = formikToMonitor(FORMIK_INITIAL_VALUES);
      httpClientMock.post.mockResolvedValue({ ok: true, resp: { _id: 'id' } });
      const wrapper = shallow(
        <CreateMonitor
          httpClient={httpClientMock}
          history={historyMock}
          setFlyout={setFlyout}
          match={match}
          location={location}
          notifications={coreMock.notifications}
        />
      );
      wrapper.instance().onSubmit(FORMIK_INITIAL_VALUES, formikBag);
      expect(httpClientMock.post).toHaveBeenCalledTimes(1);
      expect(httpClientMock.post).toHaveBeenCalledWith('../api/alerting/monitors', {
        body: JSON.stringify(monitor),
      });
    });

    test('logs error when updateMonitor rejects', async () => {
      const error = jest.spyOn(global.console, 'error');
      httpClientMock.post.mockRejectedValue(new Error('onCreate error'));
      const wrapper = shallow(
        <CreateMonitor
          httpClient={httpClientMock}
          history={historyMock}
          setFlyout={setFlyout}
          match={match}
          location={location}
          notifications={coreMock.notifications}
        />
      );
      await wrapper.instance().onSubmit(FORMIK_INITIAL_VALUES, formikBag);
      expect(error).toHaveBeenCalled();
    });

    test('logs resp when ok:false', async () => {
      const log = jest.spyOn(global.console, 'log');
      httpClientMock.post.mockResolvedValue({ ok: false, resp: 'test' });
      const wrapper = shallow(
        <CreateMonitor
          httpClient={httpClientMock}
          history={historyMock}
          setFlyout={setFlyout}
          match={match}
          location={location}
          notifications={coreMock.notifications}
        />
      );
      await wrapper.instance().onSubmit(FORMIK_INITIAL_VALUES, formikBag);
      await new Promise((r) => setTimeout(r, 100));
      expect(log).toHaveBeenCalled();
      expect(log).toHaveBeenCalledWith('Failed to create:', { ok: false, resp: 'test' });
    });
  });
});
