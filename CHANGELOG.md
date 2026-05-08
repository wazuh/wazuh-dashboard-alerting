# Change Log

All notable changes to the Wazuh dashboard alerting plugin will be documented in this file.

## Wazuh dashboard v5.0.0 - OpenSearch Dashboards 3.6.0 - Revision 01

### Added

- Support for Wazuh 5.0.0
- Added debounce to Document Level Query text inputs
- Add "Active Response" monitor type [#33](https://github.com/wazuh/wazuh-dashboard-alerting/pull/33)

### Changed

- Changed category in the side menu to `Explore` [#4](https://github.com/wazuh/wazuh-dashboard-alerting/pull/4)
- Support `date` and `ip` type fields in document level queries [#22](https://github.com/wazuh/wazuh-dashboard-alerting/pull/22)
- Hide "Add active response" button for all monitor types except "Per document monitor" / Do not auto-load notification form when adding a trigger. [#18](https://github.com/wazuh/wazuh-dashboard-alerting/pull/18)

### Fixed

- Fixed request execution in Extraction Query Editor [#24](https://github.com/wazuh/wazuh-dashboard-alerting/pull/24)
- Fixed duplicated button in Monitors list [#73](https://github.com/wazuh/wazuh-dashboard-alerting/pull/73)
