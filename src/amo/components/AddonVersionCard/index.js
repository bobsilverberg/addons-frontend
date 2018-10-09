/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { getVersionInfo } from 'amo/reducers/versions';
import translate from 'core/i18n/translate';
import { sanitizeUserHTML } from 'core/utils';
import type { AddonVersionType } from 'amo/reducers/versions';
import type { AppState } from 'amo/store';
import type { UserAgentInfoType } from 'core/reducers/api';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {|
  version: AddonVersionType,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
  userAgentInfo: UserAgentInfoType,
|};

export class AddonVersionCardBase extends React.Component<InternalProps> {
  render() {
    const { i18n, userAgentInfo, version } = this.props;
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
    // TODO: Make it a link.
    const licenceText = i18n.sprintf(
      i18n.gettext('Source code released under %(licenseName)s'),
      {
        licenseName: version.license.name,
      },
    );

    return (
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
        <div className="AddonVersionCard-license">{licenceText}</div>
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
