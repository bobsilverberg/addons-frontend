/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { getVersionInfo } from 'amo/reducers/versions';
import translate from 'core/i18n/translate';
import { sanitizeUserHTML } from 'core/utils';
import { getErrorMessage } from 'core/utils/addons';
import { getClientCompatibility } from 'core/utils/compatibility';
import type { AddonVersionType } from 'amo/reducers/versions';
import type { AppState } from 'amo/store';
import type { UserAgentInfoType } from 'core/reducers/api';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {|
  _getClientCompatibility: typeof getClientCompatibility,
  version: AddonVersionType,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
  userAgentInfo: UserAgentInfoType,
|};

export class AddonVersionCardBase extends React.Component<InternalProps> {
  static defaultProps = {
    _getClientCompatibility: getClientCompatibility,
  };

  // From Addon/index.js
  renderInstallError() {
    const { i18n, installError: error } = this.props;

    if (!error) {
      return null;
    }

    return (
      <Notice className="Addon-header-install-error" type="error">
        {getErrorMessage({ i18n, error })}
      </Notice>
    );
  }

  render() {
    const { i18n, userAgentInfo, version } = this.props;

    // From  Addon/index.js - probably need some of this to determine compatibility of versions.
    let isCompatible = false;
    let compatibility;
    if (addon) {
      compatibility = _getClientCompatibility({
        addon,
        clientApp,
        userAgentInfo,
      });
      isCompatible = compatibility.compatible;
    }

    const numberOfAddonsByAuthors = addonsByAuthors
      ? addonsByAuthors.length
      : 0;

    const isFireFox =
      compatibility && compatibility.reason !== INCOMPATIBLE_NOT_FIREFOX;
    const showInstallButton = addon && isFireFox;
    const showGetFirefoxButton = addon && !isFireFox;

    //
    //



    const fileInfo = getVersionInfo({ userAgentInfo, version });
    const fileInfoText = fileInfo ? (
      <div className="AddonVersionCard-fileInfo">
        {i18n.sprintf(
          i18n.gettext('Released %(dateReleased)s - %(fileSize)s'),
          {
            dateReleased: i18n.moment(fileInfo.created).format('ll'),
            fileSize: i18n.formatNumber(fileInfo.size),
          },
        )}
      </div>
    ) : null;
    const releaseNotes = sanitizeUserHTML(version.releaseNotes);
    // TODO: Make license name a link.
    const licenseText = version.license.name
      ? i18n.sprintf(
          i18n.gettext('Source code released under %(licenseName)s'),
          {
            licenseName: version.license.name,
          },
        )
      : i18n.gettext('Source code released under Custom license');

    return (

      // This is directly beneath an element: <Card className="Addon-header-info-card" photonStyle>
      {
        this.renderInstallError();
  }

    {
      isFireFox && !isCompatible ? (
        <AddonCompatibilityError
          className="Addon-header-compatibility-error"
          downloadUrl={compatibility.downloadUrl}
          maxVersion={compatibility.maxVersion}
          minVersion={compatibility.minVersion}
          reason={compatibility.reason}
        />
      ) : null;
    }

    //
    //

    <div className="Addon-summary-and-install-button-wrapper">
      {showSummary ? (
        <p className="Addon-summary" {...summaryProps} />
      ) : null}

      {showInstallButton &&
      config.get('enableFeatureAMInstallButton') && (
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
      {showInstallButton &&
      config.get('enableFeatureAMInstallButton') === false && (
        <InstallButton
          {...this.props}
          disabled={!isCompatible}
          defaultInstallSource={defaultInstallSource}
          status={installStatus}
          useButton
        />
      )}
      {showGetFirefoxButton && (
        <Button
          buttonType="confirm"
          href={`https://www.mozilla.org/firefox/new/${makeQueryStringWithUTM(
            {
              utm_content: addon.guid,
            },
          )}`}
          puffy
          className="Button--get-firefox"
        >
          {i18n.gettext('Only with Firefox—Get Firefox Now')}
        </Button>
      )}
    </div>

    //
    //

    <li className="AddonVersionCard">
        <h2 className="AddonVersionCard-version">{version.version}</h2>
        {fileInfoText}
        <div className="AddonVersionCard-compatibility">
          {version.compatibility}
        </div>
        // eslint-disable-next-line react/no-danger
        <div
          className="AddonVersionCard-releaseNotes"
          dangerouslySetInnerHTML={releaseNotes}
        />
        <div className="AddonVersionCard-license">{licenseText}</div>
      </li>
    );
  }
}

export function mapStateToProps(state: AppState) {
  return {
    userAgentInfo: state.api.userAgentInfo,
  };
}

const AddonVersionCard: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(AddonVersionCardBase);

export default AddonVersionCard;
