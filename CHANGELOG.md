# Change Log

All notable changes to the Wazuh dashboard alerting plugin will be documented in this file.

## Wazuh dashboard v5.0.0 - OpenSearch Dashboards 3.5.0 - Revision 00

### Added

- Support for Wazuh 5.0.0
- Added debounce to Document Level Query text inputs

### Changed

- Changed category in the side menu to `Explore` [#4](https://github.com/wazuh/wazuh-dashboard-alerting/pull/4)
- Support `date` and `ip` type fields in document level queries [#22](https://github.com/wazuh/wazuh-dashboard-alerting/pull/22)
- Hide "Add active response" button for all monitor types except "Per document monitor" / Do not auto-load notification form when adding a trigger. [#18](https://github.com/wazuh/wazuh-dashboard-alerting/pull/18)
- Hide `Extraction query editor` for per document monitors in `Create/edit monitor` form [#26](https://github.com/wazuh/wazuh-dashboard-alerting/pull/26)
