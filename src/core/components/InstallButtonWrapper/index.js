/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import { makeQueryStringWithUTM } from 'amo/utils';
import AMInstallButton from 'core/components/AMInstallButton';
import { INSTALL_SOURCE_DETAIL_PAGE, UNKNOWN } from 'core/constants';
import translate from 'core/i18n/translate';
import { withInstallHelpers } from 'core/installAddon';
import { getClientCompatibility, isFirefox } from 'core/utils/compatibility';
import Button from 'ui/components/Button';
import type { WithInstallHelpersInjectedProps } from 'core/installAddon';
import type { UserAgentInfoType } from 'core/reducers/api';
import type { InstalledAddon } from 'core/reducers/installations';
import type { AddonVersionType } from 'core/reducers/versions';
import type { AddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';
import type { AppState } from 'disco/store';

import './styles.scss';

export type Props = {|
  _getClientCompatibility?: typeof getClientCompatibility,
  _isFirefox?: typeof isFirefox,
  addon: AddonType,
  currentVersion: AddonVersionType,
|};

type InternalProps = {|
  ...Props,
  ...WithInstallHelpersInjectedProps,
  clientApp: string,
  defaultInstallSource: string,
  error: string | void,
  i18n: I18nType,
  status: $PropertyType<InstalledAddon, 'status'>,
  userAgentInfo: UserAgentInfoType,
|};

export const InstallButtonWrapperBase = (props: InternalProps) => {
  const {
    _getClientCompatibility = getClientCompatibility,
    _isFirefox = isFirefox,
    addon,
    clientApp,
    currentVersion,
    defaultInstallSource,
    enable,
    hasAddonManager,
    isAddonEnabled,
    i18n,
    install,
    installStatus,
    installTheme,
    setCurrentStatus,
    uninstall,
    userAgentInfo,
  } = props;

  let isCompatible = false;
  let compatibility;
  if (addon) {
    compatibility = _getClientCompatibility({
      addon,
      currentVersion,
      clientApp,
      userAgentInfo,
    });
    isCompatible = compatibility.compatible;
  }

  const isThisFirefox = _isFirefox({
    addon,
    clientApp,
    currentVersion,
    userAgentInfo,
  });
  const showInstallButton = addon && isThisFirefox;
  const showGetFirefoxButton = addon && !isThisFirefox;

  return (
    <div className="InstallButtonWrapper">
      {showInstallButton && (
        <AMInstallButton
          addon={addon}
          defaultInstallSource={defaultInstallSource}
          disabled={!isCompatible}
          enable={enable}
          hasAddonManager={hasAddonManager}
          install={install}
          installTheme={installTheme}
          setCurrentStatus={setCurrentStatus}
          status={installStatus}
          uninstall={uninstall}
          isAddonEnabled={isAddonEnabled}
        />
      )}
      {showGetFirefoxButton && (
        <Button
          buttonType="confirm"
          href={`https://www.mozilla.org/firefox/new/${makeQueryStringWithUTM({
            utm_content: addon.guid,
          })}`}
          puffy
          className="Button--get-firefox"
        >
          {i18n.gettext('Only with Firefox—Get Firefox Now')}
        </Button>
      )}
    </div>
  );
};

export function mapStateToProps(state: AppState, ownProps: InternalProps) {
  const { addon } = ownProps;
  const installedAddon = state.installations[addon.guid] || {};

  return {
    clientApp: state.api.clientApp,
    installError: installedAddon.error,
    installStatus: installedAddon.status || UNKNOWN,
    lang: state.api.lang,
    userAgentInfo: state.api.userAgentInfo,
  };
}

const InstallButtonWrapper: React.ComponentType<Props> = compose(
  withRouter,
  translate(),
  connect(mapStateToProps),
  withInstallHelpers({ defaultInstallSource: INSTALL_SOURCE_DETAIL_PAGE }),
)(InstallButtonWrapperBase);

export default InstallButtonWrapper;
