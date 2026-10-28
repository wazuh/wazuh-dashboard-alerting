/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { EuiHealth, EuiHighlight } from '@elastic/eui';

import { FormikComboBox } from '../../../../components/FormControls';
import {
  hasError,
  isActiveResponseFindingsIndex,
  isInvalid,
  supportsIndexPatterns,
  validateActiveResponseIndex,
  validateMonitorIndex,
} from '../../../../utils/validate';
import {
  canAppendWildcard,
  createReasonableWait,
  getDataStreamName, // Wazuh
  getMatchedOptions,
} from './utils/helpers';
import {
  ACTIVE_RESPONSE_FINDINGS_INDEX_PATTERN,
  MONITOR_TYPE,
  MONITOR_TYPE_LABEL,
} from '../../../../utils/constants';
import CrossClusterConfiguration from '../../components/CrossClusterConfigurations/containers';
import {
  getDataSourceQueryObj,
  isDataSourceChanged,
} from '../../../../../public/pages/utils/helpers';

const CustomOption = ({ option, searchValue, contentClassName }) => {
  const { health, label, index } = option;
  const isAlias = !!index;
  const healthToColor = {
    green: 'success',
    yellow: 'warning',
    red: 'danger',
    undefined: 'subdued',
  };
  const color = healthToColor[health];
  return (
    <EuiHealth color={color}>
      <span className={contentClassName}>
        <EuiHighlight search={searchValue}>{label}</EuiHighlight>
        {isAlias && <span>&nbsp;({index})</span>}
      </span>
    </EuiHealth>
  );
};

const propTypes = {
  httpClient: PropTypes.object.isRequired,
};

class MonitorIndex extends React.Component {
  constructor(props) {
    super(props);
    this.lastQuery = null;
    // Wazuh: text currently typed in the combo box search input, kept so it can be applied on blur.
    this.searchValue = '';
    // Wazuh: combo box instance, used to reset its search input once the typed text is applied.
    this.comboBox = null;
    this.setComboBoxRef = (comboBox) => (this.comboBox = comboBox);
    // Wazuh: every index, data stream and alias the searches have resolved, so that validating one
    // of them does not have to ask the cluster again.
    this.resolvedIndices = new Set();
    this.state = {
      isLoading: false,
      appendedWildcard: false,
      showingIndexPatternQueryErrors: false,
      options: [],
      allIndices: [],
      partialMatchedIndices: [],
      exactMatchedIndices: [],
      allAliases: [],
      partialMatchedAliases: [],
      exactMatchedAliases: [],
    };
    this.onCreateOption = this.onCreateOption.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.handleQueryIndices = this.handleQueryIndices.bind(this);
    this.handleQueryAliases = this.handleQueryAliases.bind(this);
    this.indexExists = this.indexExists.bind(this);
    this.onFetch = this.onFetch.bind(this);
  }

  getInitialSearchQuery() {
    return this.props.monitorType === MONITOR_TYPE.ACTIVE_RESPONSE
      ? ACTIVE_RESPONSE_FINDINGS_INDEX_PATTERN
      : '';
  }

  componentDidMount() {
    // Wazuh: the search input starts empty, `onSearchChange` falls back to the initial query.
    this.onSearchChange('');
  }

  componentDidUpdate(prevProps) {
    if (isDataSourceChanged(prevProps, this.props)) {
      this.onSearchChange('');
    }
  }

  // Wazuh: every monitor type supports several indices, so the typed index is always added to the
  // selection and `supportMultipleIndices` is no longer received.
  onCreateOption(searchValue, selectedOptions, setFieldValue) {
    const newOption = { label: searchValue.trim() };

    if (!newOption.label) return;

    // Wazuh: an index typed again is already selected, adding it twice would repeat it in the
    // monitor.
    if (selectedOptions.some(({ label }) => label === newOption.label)) return;

    // Wazuh: the monitor form does not validate on change, so validation is requested explicitly.
    // Otherwise the error of the previous value stays on screen until the next interaction.
    setFieldValue('index', selectedOptions.concat(newOption), true);
  }

  /**
   * Wazuh: apply the text left in the search input when the combo box loses focus.
   *
   * The combo box only turns typed text into a selection on blur while none of its options is
   * active, so the typed index could be silently discarded.
   *
   * @returns {boolean} whether the typed text was applied.
   */
  commitPendingSearchValue(selectedOptions, form) {
    if (!this.searchValue.trim()) return false;

    this.onCreateOption(this.searchValue, selectedOptions, form.setFieldValue);

    // Reset the search input, otherwise the combo box keeps rendering the typed text as invalid
    // instead of the index that was just applied.
    if (this.comboBox?.clearSearchValue) this.comboBox.clearSearchValue();
    else this.searchValue = '';

    return true;
  }

  /**
   * Wazuh: whether an index can be monitored, i.e. whether it resolves to an index, a data stream
   * or an alias. Used to validate an index that was typed instead of picked from the options.
   */
  async indexExists(index) {
    if (this.resolvedIndices.has(index)) return true;

    const { indices, dataStreamAliases } = await this.handleQueryIndices(index);
    if (indices.length || dataStreamAliases.length) return true;

    return (await this.handleQueryAliases(index)).length > 0;
  }

  async onSearchChange(searchValue) {
    const { appendedWildcard } = this.state;
    this.searchValue = searchValue;
    // Wazuh: the combo box clears its search input after applying a value. Falling back to the
    // initial query keeps the index options list populated instead of emptying it.
    let query = searchValue || this.getInitialSearchQuery();
    if (query.length === 1 && canAppendWildcard(query)) {
      query += '*';
      this.setState({ appendedWildcard: true });
    } else {
      if (query === '*' && appendedWildcard) {
        query = '';
        this.setState({ appendedWildcard: false });
      }
    }

    // Wazuh: resetting the search input asks for the same query again, and it is reset twice per
    // applied index, once by this component and once by the combo box itself.
    if (query === this.lastQuery) return;

    this.lastQuery = query;
    this.setState({ query, showingIndexPatternQueryErrors: !!query.length });

    await this.onFetch(query);
  }

  async handleQueryIndices(rawIndex) {
    const index = rawIndex.trim();

    // Searching for `*:` fails for CCS environments. The search request
    // is worthless anyways as the we should only send a request
    // for a specific query (where we do not append *) if there is at
    // least a single character being searched for.
    if (index === '*:') {
      return { indices: [], dataStreamAliases: [] };
    }

    // This should never match anything so do not bother
    if (index === '') {
      return { indices: [], dataStreamAliases: [] };
    }
    try {
      const dataSourceQuery = getDataSourceQueryObj();
      const response = await this.props.httpClient.post('../api/alerting/_indices', {
        body: JSON.stringify({ index }),
        query: dataSourceQuery?.query,
      });

      if (response.ok) {
        const indices = [];
        const dataStreamAliases = [];
        const dataStreamsSet = new Set();

        // Wazuh: data streams are listed instead of their backing indices.
        response.resp.forEach(({ health, index: idx, status }) => {
          const dsName = getDataStreamName(idx);
          if (dsName) {
            if (!dataStreamsSet.has(dsName)) {
              dataStreamsSet.add(dsName);
              dataStreamAliases.push({ label: dsName });
              this.resolvedIndices.add(dsName); // Wazuh
            }
          } else {
            indices.push({ label: idx, health, status });
            this.resolvedIndices.add(idx); // Wazuh
          }
        });

        return {
          indices: _.sortBy(indices, 'label'),
          dataStreamAliases: _.sortBy(dataStreamAliases, 'label'),
        };
      }
      return { indices: [], dataStreamAliases: [] };
    } catch (err) {
      console.error(err);
      return { indices: [], dataStreamAliases: [] };
    }
  }

  async handleQueryAliases(rawAlias) {
    const alias = rawAlias.trim();

    if (alias === '*:') {
      return [];
    }

    if (alias === '') {
      return [];
    }

    try {
      const dataSourceQuery = getDataSourceQueryObj();
      const response = await this.props.httpClient.post('../api/alerting/_aliases', {
        body: JSON.stringify({ alias }),
        query: dataSourceQuery?.query,
      });

      if (response.ok) {
        const indices = response.resp.map(({ alias, index }) => ({ label: alias, index }));
        indices.forEach(({ label }) => this.resolvedIndices.add(label)); // Wazuh
        return _.sortBy(indices, 'label');
      }
      return [];
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  async onFetch(query) {
    this.setState({ isLoading: true, indexPatternExists: false });
    if (query.endsWith('*')) {
      const exactResult = await this.handleQueryIndices(query);
      const exactMatchedAliases = await this.handleQueryAliases(query);
      createReasonableWait(() => {
        // If the search changed, discard this state
        if (query !== this.lastQuery) {
          return;
        }
        this.setState({
          exactMatchedIndices: exactResult.indices,
          exactMatchedAliases: exactMatchedAliases.concat(exactResult.dataStreamAliases),
          isLoading: false,
        });
      });
    } else {
      const partialResult = await this.handleQueryIndices(`${query}*`);
      const exactResult = await this.handleQueryIndices(query);
      const partialMatchedAliases = await this.handleQueryAliases(`${query}*`);
      const exactMatchedAliases = await this.handleQueryAliases(query);
      createReasonableWait(() => {
        // If the search changed, discard this state
        if (query !== this.lastQuery) {
          return;
        }

        this.setState({
          partialMatchedIndices: partialResult.indices,
          exactMatchedIndices: exactResult.indices,
          partialMatchedAliases: partialMatchedAliases.concat(partialResult.dataStreamAliases),
          exactMatchedAliases: exactMatchedAliases.concat(exactResult.dataStreamAliases),
          isLoading: false,
        });
      });
    }
  }

  renderOption(option, searchValue, contentClassName) {
    return (
      <CustomOption option={option} searchValue={searchValue} contentClassName={contentClassName} />
    );
  }

  render() {
    const { httpClient, canCallGetRemoteIndexes, remoteMonitoringEnabled } = this.props;
    const {
      isLoading,
      allIndices,
      partialMatchedIndices,
      exactMatchedIndices,
      allAliases,
      partialMatchedAliases,
      exactMatchedAliases,
    } = this.state;

    let { visibleOptions } = getMatchedOptions(
      allIndices, //all indices
      partialMatchedIndices,
      exactMatchedIndices,
      allAliases,
      partialMatchedAliases,
      exactMatchedAliases,
      false //isIncludingSystemIndices
    );

    // Wazuh: restrict index options to findings indices for Active Response monitors
    const isActiveResponse = this.props.monitorType === MONITOR_TYPE.ACTIVE_RESPONSE;
    if (isActiveResponse) {
      visibleOptions = visibleOptions
        .map((group) => ({
          ...group,
          options: group.options.filter(({ label }) => isActiveResponseFindingsIndex(label)),
        }))
        .filter((group) => group.options.length > 0);
    }

    // Wazuh: document level and Active Response monitors are rejected by the backend when the index
    // is a pattern, so the help text must not advertise wildcards or date math for them.
    const indexHelpText = supportsIndexPatterns(this.props.monitorType)
      ? 'You can use a * as a wildcard or date math index resolution in your index pattern'
      : `${_.upperFirst(
          MONITOR_TYPE_LABEL[this.props.monitorType]
        )} do not support index patterns. Specify concrete index names, without wildcards or date math index resolution.`;

    // Wazuh: a typed index bypasses the options list, so Active Response monitors validate that the
    // selected values are existing findings indices. The rest of the monitor types only need the
    // restrictions that come with the monitor type, index patterns among them.
    const indexValidator = isActiveResponse
      ? validateActiveResponseIndex(this.indexExists)
      : validateMonitorIndex(this.props.monitorType);

    // Wazuh: the per document monitor case, which disabled `supportMultipleIndices`, was removed.
    // Like Active Response monitors, they fall in the default case.
    let supportsCrossClusterMonitoring = false;
    switch (this.props.monitorType) {
      case MONITOR_TYPE.BUCKET_LEVEL:
      case MONITOR_TYPE.CLUSTER_METRICS:
      case MONITOR_TYPE.QUERY_LEVEL:
        supportsCrossClusterMonitoring = true;
        break;
      default:
    }

    return (
      <>
        {remoteMonitoringEnabled && canCallGetRemoteIndexes && supportsCrossClusterMonitoring ? (
          <CrossClusterConfiguration monitorType={this.props.monitorType} httpClient={httpClient} />
        ) : (
          <FormikComboBox
            name="index"
            formRow
            fieldProps={{ validate: indexValidator }}
            rowProps={{
              label: 'Index',
              helpText: indexHelpText,
              isInvalid,
              error: hasError,
              style: { paddingLeft: '10px' },
            }}
            inputProps={{
              // Wazuh: every monitor type monitors several indices, Active Response and per
              // document monitors included.
              placeholder: 'Select indices',
              async: true,
              isLoading,
              options: visibleOptions,
              comboBoxRef: this.setComboBoxRef,
              onBlur: (e, field, form) => {
                // Wazuh: apply the typed index, the combo box does not always do it.
                const applied = this.commitPendingSearchValue(field.value, form);
                // Wazuh: `setFieldTouched` validates the value the form had when this handler
                // started, so validating here after applying a value would bring the error of the
                // previous value back until the next interaction. The value applied above asks for
                // validation itself.
                form.setFieldTouched('index', true, !applied);
              },
              onChange: (options, field, form) => {
                // Wazuh: the form does not validate on change, so picking an index from the options
                // would otherwise keep the error of the index it replaces until the next blur.
                form.setFieldValue('index', options, true);
              },
              onCreateOption: (value, field, form) => {
                // Wazuh: `supportMultipleIndices` is no longer passed.
                this.onCreateOption(value, field.value, form.setFieldValue);
              },
              onSearchChange: this.onSearchChange,
              renderOption: this.renderOption,
              delimiter: ',',
              isClearable: true,
              // Wazuh: `singleSelection` was removed, every monitor type selects several indices.
              'data-test-subj': 'indicesComboBox',
            }}
          />
        )}
      </>
    );
  }
}

MonitorIndex.propTypes = propTypes;

export default MonitorIndex;
