/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { getChannelOptions, getDefaultScript, getTriggerContext, getTimeZone } from './helper';
import { BACKEND_CHANNEL_TYPE, CHANNEL_TYPE, MONITOR_TYPE } from '../../../utils/constants';
import {
  FORMIK_INITIAL_DOC_LEVEL_SCRIPT,
  FORMIK_INITIAL_TRIGGER_VALUES,
} from '../containers/CreateTrigger/utils/constants';
import {
  API_TYPES,
  DEFAULT_CLUSTER_METRICS_SCRIPT,
} from '../../CreateMonitor/components/ClusterMetricsMonitor/utils/clusterMetricsMonitorConstants';

describe('CreateTrigger/utils/helper', () => {
  // Wazuh: the group heading used to render the raw backend key
  describe('getChannelOptions', () => {
    test('names each group after its channel type', () => {
      const channels = [
        { label: 'Block-IP', value: 'ar-1', type: BACKEND_CHANNEL_TYPE.ACTIVE_RESPONSE },
        { label: '[Channel] Ops', value: 'ch-1', type: BACKEND_CHANNEL_TYPE.SLACK },
      ];

      expect(getChannelOptions(channels).map(({ key, label }) => ({ key, label }))).toEqual([
        {
          key: BACKEND_CHANNEL_TYPE.ACTIVE_RESPONSE,
          label: CHANNEL_TYPE[BACKEND_CHANNEL_TYPE.ACTIVE_RESPONSE],
        },
        {
          key: BACKEND_CHANNEL_TYPE.SLACK,
          label: CHANNEL_TYPE[BACKEND_CHANNEL_TYPE.SLACK],
        },
      ]);
    });

    test('falls back to the type of an unknown channel', () => {
      expect(getChannelOptions([{ value: 'x', type: 'brand_new' }])[0].label).toBe('brand_new');
    });
  });
  describe('getDefaultScript', () => {
    test('when monitor_type is undefined', () => {
      const monitorValues = undefined;
      expect(getDefaultScript(monitorValues)).toEqual(FORMIK_INITIAL_TRIGGER_VALUES.script);
    });

    test(`when monitor_type is ${MONITOR_TYPE.BUCKET_LEVEL}`, () => {
      const monitorValues = { monitor_type: MONITOR_TYPE.BUCKET_LEVEL };
      expect(getDefaultScript(monitorValues)).toEqual(FORMIK_INITIAL_TRIGGER_VALUES.bucketSelector);
    });

    test(`when monitor_type is ${MONITOR_TYPE.DOC_LEVEL}`, () => {
      const monitorValues = { monitor_type: MONITOR_TYPE.DOC_LEVEL };
      expect(getDefaultScript(monitorValues)).toEqual(FORMIK_INITIAL_DOC_LEVEL_SCRIPT);
    });

    // Wazuh: Add test case for ACTIVE_RESPONSE monitor type
    test(`when monitor_type is ${MONITOR_TYPE.ACTIVE_RESPONSE}`, () => {
      const monitorValues = { monitor_type: MONITOR_TYPE.ACTIVE_RESPONSE };
      expect(getDefaultScript(monitorValues)).toEqual(FORMIK_INITIAL_DOC_LEVEL_SCRIPT);
    });

    test(`when monitor_type is ${MONITOR_TYPE.QUERY_LEVEL}`, () => {
      const monitorValues = { monitor_type: MONITOR_TYPE.QUERY_LEVEL };
      expect(getDefaultScript(monitorValues)).toEqual(FORMIK_INITIAL_TRIGGER_VALUES.script);
    });

    describe(`when monitor_type is ${MONITOR_TYPE.CLUSTER_METRICS}`, () => {
      test('and api_type is undefined', () => {
        const monitorValues = {
          monitor_type: MONITOR_TYPE.CLUSTER_METRICS,
          uri: undefined,
        };
        expect(getDefaultScript(monitorValues)).toEqual(DEFAULT_CLUSTER_METRICS_SCRIPT);
      });

      test('and api_type is empty', () => {
        const monitorValues = {
          monitor_type: MONITOR_TYPE.CLUSTER_METRICS,
          uri: {
            api_type: '',
          },
        };
        expect(getDefaultScript(monitorValues)).toEqual(DEFAULT_CLUSTER_METRICS_SCRIPT);
      });

      test('and api_type does not have a default condition', () => {
        const monitorValues = {
          monitor_type: MONITOR_TYPE.CLUSTER_METRICS,
          uri: {
            api_type: 'unknownApi',
          },
        };
        expect(getDefaultScript(monitorValues)).toEqual(DEFAULT_CLUSTER_METRICS_SCRIPT);
      });

      _.keys(API_TYPES).forEach((apiType) => {
        test(`and api_type is ${apiType}`, () => {
          const monitorValues = {
            monitor_type: MONITOR_TYPE.CLUSTER_METRICS,
            uri: {
              api_type: apiType,
            },
          };
          const expectedOutput = _.get(API_TYPES, `${apiType}.defaultCondition`);
          if (!_.isEmpty(expectedOutput))
            expect(getDefaultScript(monitorValues)).toEqual(expectedOutput);
        });
      });
    });
  });
});
