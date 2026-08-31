/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  isInvalid,
  hasError,
  validateActionName,
  validateMonitorName,
  validatePositiveInteger,
  validateUnit,
  validateMonthlyDay,
  ILLEGAL_CHARACTERS,
  validateIndex,
  validateMonitorIndex,
  supportsIndexPatterns,
  containsIndexPatternSyntax,
  getIndexPatternError,
  validateActiveResponseInterval,
  validateActiveResponseUnit,
  isIndexPatternQueryValid,
  requiredNumber,
} from './validate';
import { MONITOR_TYPE } from './constants';
import { FORMIK_INITIAL_VALUES } from '../pages/CreateMonitor/containers/CreateMonitor/utils/constants';
import { TRIGGER_TYPE } from '../pages/CreateTrigger/containers/CreateTrigger/utils/constants';

const httpClient = {
  post: jest.fn(),
};

beforeEach(() => {
  jest.resetAllMocks();
});

describe('isInvalid', () => {
  test('returns true if error and touched', () => {
    const form = { touched: { test: true }, errors: { test: 'error' } };
    const name = 'test';
    expect(isInvalid(name, form)).toBe(true);
  });

  test('returns false if error and not touched', () => {
    const form = { touched: { test: false }, errors: { test: 'error' } };
    const name = 'test';
    expect(isInvalid(name, form)).toBe(false);
  });

  test('returns false if no error and touched', () => {
    const form = { touched: { test: true }, errors: {} };
    const name = 'test';
    expect(isInvalid(name, form)).toBe(false);
  });

  test('returns false if no error and not touched', () => {
    const form = { touched: {}, errors: {} };
    const name = 'test';
    expect(isInvalid(name, form)).toBe(false);
  });
});

describe('hasError', () => {
  test('returns undefined if no error', () => {
    const form = { touched: {}, errors: {} };
    const name = 'test';
    expect(hasError(name, form)).toBeUndefined();
  });

  test('returns error if exists', () => {
    const form = { touched: {}, errors: { test: 'This is error' } };
    const name = 'test';
    expect(hasError(name, form)).toBe(form.errors.test);
  });
});

describe('validateActionName', () => {
  const trigger = {
    name: 'trigger_name',
    [TRIGGER_TYPE.QUERY_LEVEL]: { actions: [{ name: 'foo' }, { name: 'bar' }] },
  };
  const monitor = FORMIK_INITIAL_VALUES;
  test('returns undefined if no error', () => {
    expect(validateActionName(monitor, trigger)('valid action name')).toBeUndefined();
  });

  test('returns Required string if falsy value', () => {
    expect(validateActionName(monitor, trigger)()).toBe('Required.');
    expect(validateActionName(monitor, trigger)('')).toBe('Required.');
  });

  trigger[TRIGGER_TYPE.QUERY_LEVEL].actions.push({ name: 'foo' });
  test('returns already used if action name is already used', () => {
    expect(validateActionName(monitor, trigger)('foo')).toBe('Action name is already used.');
  });
});

describe('validateMonitorName', () => {
  httpClient.post.mockResolvedValue({ resp: { hits: { total: 0 } } });
  test('returns undefined if no error', () => {
    expect(validateMonitorName(httpClient, {})('valid monitor name')).resolves.toBeUndefined();
  });

  test('returns Required string if falsy value', () => {
    validateMonitorName(httpClient, {})().catch((err) => expect(err).toEqual('Required.'));
    validateMonitorName(httpClient, {})('').catch((err) => expect(err).toEqual('Required.'));
  });
});

describe('validatePositiveInteger', () => {
  test('returns undefined if no error', () => {
    expect(validatePositiveInteger(1)).toBeUndefined();
    expect(validatePositiveInteger(100)).toBeUndefined();
  });

  test('returns error string if invalid value', () => {
    const invalidText = 'Must be a positive integer.';
    expect(validatePositiveInteger(-5)).toBe(invalidText);
    expect(validatePositiveInteger(0)).toBe(invalidText);
    expect(validatePositiveInteger(1.5)).toBe(invalidText);
    expect(validatePositiveInteger(true)).toBe(invalidText);
    expect(validatePositiveInteger(false)).toBe(invalidText);
    expect(validatePositiveInteger('5')).toBe(invalidText);
  });
});

describe('validateUnit', () => {
  test('returns undefined if no error', () => {
    expect(validateUnit('MINUTES')).toBeUndefined();
    expect(validateUnit('HOURS')).toBeUndefined();
    expect(validateUnit('DAYS')).toBeUndefined();
  });

  test('returns error string if invalid value', () => {
    const invalidText = 'Must be one of minutes, hours, days.';
    expect(validateUnit(5)).toBe(invalidText);
    expect(validateUnit('RANDOM')).toBe(invalidText);
    expect(validateUnit(null)).toBe(invalidText);
    expect(validateUnit(true)).toBe(invalidText);
    expect(validateUnit(false)).toBe(invalidText);
  });
});

describe('validateMonthlyDay', () => {
  test('returns undefined if no error', () => {
    expect(validateMonthlyDay(1)).toBeUndefined();
    expect(validateMonthlyDay(17)).toBeUndefined();
    expect(validateMonthlyDay(31)).toBeUndefined();
  });

  test('returns error string if invalid value', () => {
    const invalidText = 'Must be a positive integer between 1-31.';
    expect(validateMonthlyDay(-5)).toBe(invalidText);
    expect(validateMonthlyDay(0)).toBe(invalidText);
    expect(validateMonthlyDay(1.5)).toBe(invalidText);
    expect(validateMonthlyDay(32)).toBe(invalidText);
    expect(validateMonthlyDay('RANDOM')).toBe(invalidText);
    expect(validateMonthlyDay(null)).toBe(invalidText);
    expect(validateMonthlyDay(true)).toBe(invalidText);
    expect(validateMonthlyDay(false)).toBe(invalidText);
    expect(validateMonthlyDay('17')).toBe(invalidText);
  });
});

describe('isIndexPatternQueryValid', () => {
  test('returns true if valid pattern', () => {
    expect(isIndexPatternQueryValid('good', ILLEGAL_CHARACTERS)).toBe(true);
    expect(isIndexPatternQueryValid('.good', ILLEGAL_CHARACTERS)).toBe(true);
    expect(isIndexPatternQueryValid('good*', ILLEGAL_CHARACTERS)).toBe(true);
  });

  test('returns false if falsy pattern', () => {
    expect(isIndexPatternQueryValid('', ILLEGAL_CHARACTERS)).toBe(false);
    expect(isIndexPatternQueryValid(undefined, ILLEGAL_CHARACTERS)).toBe(false);
    expect(isIndexPatternQueryValid(null, ILLEGAL_CHARACTERS)).toBe(false);
    expect(isIndexPatternQueryValid(false, ILLEGAL_CHARACTERS)).toBe(false);
  });

  test('returns false if pattern is . or ..', () => {
    expect(isIndexPatternQueryValid('.', ILLEGAL_CHARACTERS)).toBe(false);
    expect(isIndexPatternQueryValid('..', ILLEGAL_CHARACTERS)).toBe(false);
  });

  test.each(ILLEGAL_CHARACTERS)('returns false if pattern contains %s', (char) => {
    expect(isIndexPatternQueryValid(`random${char}pattern`, ILLEGAL_CHARACTERS)).toBe(false);
  });
});

describe('validateIndex', () => {
  test('returns undefined if valid index options', () => {
    expect(validateIndex([{ label: 'valid-index' }, { label: 'valid*' }])).toBeUndefined();
  });

  test('returns error string if non array is passed in', () => {
    const invalidText = 'Must specify an index.';
    expect(validateIndex(1)).toBe(invalidText);
    expect(validateIndex(null)).toBe(invalidText);
    expect(validateIndex('test')).toBe(invalidText);
    expect(validateIndex({})).toBe(invalidText);
  });

  test('returns error string if empty array', () => {
    const invalidText = 'Must specify an index.';
    expect(validateIndex([])).toBe(invalidText);
  });

  test('returns error string if invalid index pattern', () => {
    const illegalCharacters = ILLEGAL_CHARACTERS.join(' ');
    const invalidText = `One of your inputs contains invalid characters or spaces. Please omit: ${illegalCharacters}`;
    expect(validateIndex([{ label: 'valid- index$' }])).toBe(invalidText);
  });

  // Wazuh: document level monitors reject index patterns in the backend
  test('returns error string if a doc level monitor uses an index pattern', () => {
    [MONITOR_TYPE.DOC_LEVEL, MONITOR_TYPE.ACTIVE_RESPONSE].forEach((monitorType) => {
      expect(validateIndex([{ label: 'wazuh-findings-v5-*' }], monitorType)).toBe(
        getIndexPatternError(monitorType)
      );
      expect(validateIndex([{ label: '<wazuh-alerts-{now/d}>' }], monitorType)).toBe(
        getIndexPatternError(monitorType)
      );
    });
  });

  test('returns undefined if a doc level monitor uses a concrete index', () => {
    expect(
      validateIndex([{ label: 'wazuh-findings-v5-000001' }], MONITOR_TYPE.DOC_LEVEL)
    ).toBeUndefined();
  });

  test('allows index patterns for monitor types that support them', () => {
    [MONITOR_TYPE.QUERY_LEVEL, MONITOR_TYPE.BUCKET_LEVEL, undefined].forEach((monitorType) => {
      expect(validateIndex([{ label: 'wazuh-findings-v5-*' }], monitorType)).toBeUndefined();
    });
  });
});

describe('validateMonitorIndex', () => {
  test('binds the monitor type to the validator', () => {
    expect(validateMonitorIndex(MONITOR_TYPE.DOC_LEVEL)([{ label: 'wazuh-alerts-*' }])).toBe(
      getIndexPatternError(MONITOR_TYPE.DOC_LEVEL)
    );
    expect(
      validateMonitorIndex(MONITOR_TYPE.QUERY_LEVEL)([{ label: 'wazuh-alerts-*' }])
    ).toBeUndefined();
  });
});

describe('supportsIndexPatterns', () => {
  test('returns false only for doc level monitor types', () => {
    expect(supportsIndexPatterns(MONITOR_TYPE.DOC_LEVEL)).toBe(false);
    expect(supportsIndexPatterns(MONITOR_TYPE.ACTIVE_RESPONSE)).toBe(false);
    expect(supportsIndexPatterns(MONITOR_TYPE.QUERY_LEVEL)).toBe(true);
    expect(supportsIndexPatterns(MONITOR_TYPE.BUCKET_LEVEL)).toBe(true);
    expect(supportsIndexPatterns(MONITOR_TYPE.CLUSTER_METRICS)).toBe(true);
  });
});

describe('containsIndexPatternSyntax', () => {
  test('returns true for wildcards, date math, _all and empty names', () => {
    expect(containsIndexPatternSyntax('wazuh-findings-v5-*')).toBe(true);
    expect(containsIndexPatternSyntax('wazuh-alerts-?')).toBe(true);
    expect(containsIndexPatternSyntax('<wazuh-alerts-{now/d}>')).toBe(true);
    expect(containsIndexPatternSyntax('_all')).toBe(true);
    expect(containsIndexPatternSyntax('')).toBe(true);
    expect(containsIndexPatternSyntax(undefined)).toBe(true);
  });

  test('returns false for a single index name', () => {
    expect(containsIndexPatternSyntax('wazuh-findings-v5-000001')).toBe(false);
    // Dots are valid in an index name, so they must not be flagged as a pattern
    expect(containsIndexPatternSyntax('wazuh-alerts-4.x-2026.08.03')).toBe(false);
  });
});

describe('requiredNumber', () => {
  test('returns undefined for negative integers', () => {
    expect(requiredNumber(-10)).toBeUndefined();
  });

  test('returns undefined for negative decimal number', () => {
    expect(requiredNumber(-10.25)).toBeUndefined();
  });

  test('returns undefined for 0', () => {
    expect(requiredNumber(0)).toBeUndefined();
  });

  test('returns undefined for positive decimal number', () => {
    expect(requiredNumber(10.25)).toBeUndefined();
  });

  test('returns undefined for positive integer', () => {
    expect(requiredNumber(10)).toBeUndefined();
  });

  test('returns error text for string value', () => {
    expect(requiredNumber('NaN')).toBe('Requires numerical value.');
  });

  test('returns error text for undefined value', () => {
    expect(requiredNumber(undefined)).toBe('Requires numerical value.');
  });

  test('returns error text for null value', () => {
    expect(requiredNumber(null)).toBe('Requires numerical value.');
  });
});

// Wazuh: Active Response monitors run at most once per minute
describe('validateActiveResponseInterval', () => {
  test('caps the interval at 60 seconds', () => {
    expect(validateActiveResponseInterval('SECONDS')(1)).toBeUndefined();
    expect(validateActiveResponseInterval('SECONDS')(60)).toBeUndefined();
    expect(validateActiveResponseInterval('SECONDS')(61)).toBe('Must be between 1 and 60 seconds.');
  });

  test('allows a single minute, and nothing longer', () => {
    expect(validateActiveResponseInterval('MINUTES')(1)).toBeUndefined();
    expect(validateActiveResponseInterval('MINUTES')(2)).toBe('Must be between 1 and 1 minutes.');
  });

  test('rejects non positive integers', () => {
    [0, -1, 1.5, undefined].forEach((value) => {
      expect(validateActiveResponseInterval('SECONDS')(value)).toBe(
        'Must be between 1 and 60 seconds.'
      );
    });
  });

  test('rejects a unit the schedule cannot be expressed in', () => {
    expect(validateActiveResponseInterval('HOURS')(1)).toBe('Must be one of seconds, minutes.');
  });
});

describe('validateActiveResponseUnit', () => {
  test('accepts seconds and minutes only', () => {
    expect(validateActiveResponseUnit('SECONDS')).toBeUndefined();
    expect(validateActiveResponseUnit('MINUTES')).toBeUndefined();
    expect(validateActiveResponseUnit('DAYS')).toBe('Must be one of seconds, minutes.');
  });
});
