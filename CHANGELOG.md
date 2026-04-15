# Change Log

All notable changes to the Wazuh dashboard alerting plugin will be documented in this file.

## Wazuh dashboard v5.0.0 - OpenSearch Dashboards 3.5.0 - Revision 01

### Added

- Support for Wazuh 5.0.0
- Added debounce to Document Level Query text inputs [#23](https://github.com/wazuh/wazuh-dashboard-alerting/pull/23)
- Added active response action to the trigger configuration for **Per document monitor** [#7](https://github.com/wazuh/wazuh-dashboard-alerting/pull/7) [#18](https://github.com/wazuh/wazuh-dashboard-alerting/pull/18)

### Changed

- Changed category in the side menu to `Explore` [#4](https://github.com/wazuh/wazuh-dashboard-alerting/pull/4)
- Support `date` and `ip` type fields in document level queries [#22](https://github.com/wazuh/wazuh-dashboard-alerting/pull/22) 
- Hide `Extraction query editor` for per document monitors in `Create/edit monitor` form [#26](https://github.com/wazuh/wazuh-dashboard-alerting/pull/26)
