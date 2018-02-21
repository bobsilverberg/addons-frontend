/* @flow */
import { oneLine } from 'common-tags';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import log from 'core/logger';
import { OS_ALL } from 'core/constants';
import translate from 'core/i18n/translate';
import { userAgentOSToPlatform } from 'core/installAddon';
import type { AddonType } from 'core/types/addons';
import type { ApiStateType, UserAgentInfoType } from 'core/reducers/api';
import type { I18nType } from 'core/types/i18n';
import Card from 'ui/components/Card';
import LoadingText from 'ui/components/LoadingText';

import './styles.scss';

type Props = {|
  addon: AddonType | null,
  i18n: I18nType,
  userAgentInfo: UserAgentInfoType,
|};

export class PermissionsCardBase extends React.Component<Props> {
  render() {
    const { addon, i18n, userAgentInfo } = this.props;
    let content;
    const permissionsToDisplay = [];

    // These should be kept in sync with Firefox's strings for webextention permissions
    // which can be found in
    // https://hg.mozilla.org/mozilla-central/raw-file/tip/browser/locales/en-US/chrome/browser/browser.properties
    const permissionStrings = {
      bookmarks: i18n.gettext('Read and modify bookmarks'),
      browserSettings: i18n.gettext('Read and modify browser settings'),
      browsingData: i18n.gettext('Clear recent browsing history, cookies, and related data'),
      clipboardRead: i18n.gettext('Get data from the clipboard'),
      clipboardWrite: i18n.gettext('Input data to the clipboard'),
      devtools: i18n.gettext('Extend developer tools to access your data in open tabs'),
      downloads: i18n.gettext('Download files and read and modify the browser’s download history'),
      'downloads.open': i18n.gettext('Open files downloaded to your computer'),
      find: i18n.gettext('Read the text of all open tabs'),
      geolocation: i18n.gettext('Access your location'),
      history: i18n.gettext('Access browsing history'),
      management: i18n.gettext('Monitor extension usage and manage themes'),
      // In Firefox the following message replaces the name "Firefox" with the
      // current brand name, e.g., "Nightly", but we do not need to do that.
      nativeMessaging: i18n.gettext('Exchange messages with programs other than Firefox'),
      notifications: i18n.gettext('Display notifications to you'),
      pkcs11: i18n.gettext('Provide cryptographic authentication services'),
      proxy: i18n.gettext('Control browser proxy setting'),
      privacy: i18n.gettext('Read and modify privacy settings'),
      sessions: i18n.gettext('Access recently closed tabs'),
      tabs: i18n.gettext('Access browser tabs'),
      tabHide: i18n.gettext('Hide and show browser tabs'),
      topSites: i18n.gettext('Access browsing history'),
      unlimitedStorage: i18n.gettext('Store unlimited amount of client-side data'),
      webNavigation: i18n.gettext('Access browser activity during navigation'),
      allUrls: i18n.gettext('Access your data for all websites'),
      wildcard: (domain) => {
        return i18n.sprintf(
          i18n.gettext('Access your data for sites in the %(domain)s domain'),
          { domain }
        );
      },
      tooManyWildcards: (count) => {
        return i18n.sprintf(
          i18n.gettext('Access your data in %(count)s other domains'),
          { count: i18n.formatNumber(count) },
        );
      },
      oneSite: (site) => {
        return i18n.sprintf(
          i18n.gettext('Access your data for %(site)s'),
          { site }
        );
      },
      tooManySites: (count) => {
        return i18n.sprintf(
          i18n.gettext('Access your data on %(count)s other sites'),
          { count: i18n.formatNumber(count) },
        );
      },
    };

    // Classify a permission as a host/origin permission or a regular permission.
    function classifyPermission(permission) {
      const match = /^(\w+)(?:\.(\w+)(?:\.\w+)*)?$/.exec(permission);
      let result = { type: 'permissions', value: permission };
      if (!match) {
        result = { type: 'hosts', value: permission };
      }
      return result;
    }

    // Format and sequence all the permission <li>s.
    function formatPermissionStrings(addonPermissions) {
      const permissions = { hosts: [], permissions: [] };

      // First, categorize them into host permissions and regular permissions.
      for (const permission of addonPermissions) {
        const permissionInfo = classifyPermission(permission);
        permissions[permissionInfo.type].push(permissionInfo.value);
      }

      // Classify the host permissions.
      let allUrls = false;
      const wildcards = [];
      const sites = [];
      for (const permission of permissions.hosts) {
        if (permission === '<all_urls>') {
          allUrls = true;
          break;
        }
        if (permission.startsWith('moz-extension:')) {
          continue;
        }
        const match = /^[a-z*]+:\/\/([^/]+)\//.exec(permission);
        if (!match) {
          log.debug(`Host permission string "${permission}" appears to be invalid.`);
          continue;
        }
        if (match[1] === '*') {
          allUrls = true;
        } else if (match[1].startsWith('*.')) {
          wildcards.push(match[1].slice(2));
        } else {
          sites.push(match[1]);
        }
      }

      // Format the host permissions.  If we have a wildcard for all urls,
      // a single string will suffice.  Otherwise, show domain wildcards
      // first, then individual host permissions.

      if (allUrls) {
        permissionsToDisplay.push(
          <li
            className="allUrls"
            key="allUrls"
          >
            {permissionStrings.allUrls}
          </li>
        );
      } else {
        // Formats a list of host permissions.  If we have 4 or fewer, display
        // them all, otherwise display the first 3 followed by an item that
        // says "...plus N others".
        const format = (list, itemKey, moreKey) => {
          function formatItems(items) {
            permissionsToDisplay.push(...items.map((item) => {
              return (
                <li
                  className={itemKey}
                  key={`${itemKey}-${item}`}
                >
                  {permissionStrings[itemKey](item)}
                </li>);
            }));
          }
          if (list.length < 5) {
            formatItems(list);
          } else {
            formatItems(list.slice(0, 3));

            const remaining = list.length - 3;
            permissionsToDisplay.push(
              <li
                className={moreKey}
                key={moreKey}
              >
                {permissionStrings[moreKey](remaining)}
              </li>
            );
          }
        };

        format(wildcards, 'wildcard', 'tooManyWildcards');
        format(sites, 'oneSite', 'tooManySites');
      }

      // Next, show the native messaging permission if it is present.
      const nativeMessagingPermission = 'nativeMessaging';
      if (permissions.permissions.includes(nativeMessagingPermission)) {
        permissionsToDisplay.push(
          <li
            className={nativeMessagingPermission}
            key={nativeMessagingPermission}
          >
            {permissionStrings[nativeMessagingPermission]}
          </li>
        );
      }

      // Finally, show remaining permissions, sorted alphabetically by the
      // permission string to match Firefox.
      const permissionsCopy = permissions.permissions.slice(0);
      for (const permission of permissionsCopy.sort()) {
        // nativeMessaging is handled above.
        if (permission === 'nativeMessaging') {
          continue;
        }
        // Only output a permission if we have a string defined for it.
        if (permissionStrings[permission]) {
          permissionsToDisplay.push(
            <li
              className={permission}
              key={permission}
            >
              {permissionStrings[permission]}
            </li>
          );
        }
      }
      return permissionsToDisplay;
    }

    function getPermissions() {
      const agentOsName =
        userAgentInfo.os.name && userAgentInfo.os.name.toLowerCase();
      const platform = userAgentOSToPlatform[agentOsName];
      const file = addon.platformFiles[platform] || addon.platformFiles[OS_ALL];

      if (!file) {
        log.debug(oneLine`No file exists for platform "${agentOsName}"
        (mapped to "${platform}"); platform files:`, addon.platformFiles);
        return [];
      }

      return file.permissions;
    }

    if (!addon) {
      content = <LoadingText width={100} />;
    } else {
      const permissions = formatPermissionStrings(getPermissions());
      content = permissions.length ? (
        <ul className="Permissions-list">
          {permissions}
        </ul>
      ) : null;
    }

    return (
      <Card
        header={i18n.gettext('Permissions')}
        className="Addon-permissions"
      >
        {content}
      </Card>
    );
  }
}

export const mapStateToProps = (state: {| api: ApiStateType |}) => {
  return {
    userAgentInfo: state.api.userAgentInfo,
  };
};

export default compose(
  connect(mapStateToProps),
  translate(),
)(PermissionsCardBase);
