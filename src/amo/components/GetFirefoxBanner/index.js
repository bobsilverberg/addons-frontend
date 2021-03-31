/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Notice from 'amo/components/Notice';
import { DOWNLOAD_FIREFOX_BASE_URL } from 'amo/constants';
import { makeQueryStringWithUTM } from 'amo/utils';
import { replaceStringsWithJSX } from 'amo/i18n/utils';
import translate from 'amo/i18n/translate';
import tracking from 'amo/tracking';
import { isFirefox } from 'amo/utils/compatibility';
import Button from 'amo/components/Button';
import type { AppState } from 'amo/store';
import type { UserAgentInfoType } from 'amo/reducers/api';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

export const GET_FIREFOX_BUTTON_CLICK_ACTION = 'download-firefox-header-click';
export const GET_FIREFOX_BUTTON_CLICK_CATEGORY = 'AMO Download Firefox';

export type Props = {||};

export type DeafultProps = {|
  _tracking: typeof tracking,
|};

type PropsFromState = {|
  userAgentInfo: UserAgentInfoType,
|};

type InternalProps = {|
  ...Props,
  ...DeafultProps,
  ...PropsFromState,
  i18n: I18nType,
|};

export const GetFirefoxBannerBase = ({
  _tracking = tracking,
  i18n,
  userAgentInfo,
}: InternalProps): null | React.Node => {
  const onButtonClick = () => {
    _tracking.sendEvent({
      action: GET_FIREFOX_BUTTON_CLICK_ACTION,
      category: GET_FIREFOX_BUTTON_CLICK_CATEGORY,
    });
  };

  if (isFirefox({ userAgentInfo })) {
    return null;
  }

  const utmContent = 'header-download-button';
  const bannerContent = replaceStringsWithJSX({
    text: i18n.gettext(
      `To use these add-ons, you'll need to %(linkStart)sdownload Firefox%(linkEnd)s`,
    ),
    replacements: [
      [
        'linkStart',
        'linkEnd',
        (text) => (
          <>
            <br />
            <Button
              buttonType="none"
              className="GetFirefoxBanner-button"
              href={`${DOWNLOAD_FIREFOX_BASE_URL}${makeQueryStringWithUTM({
                utm_content: utmContent,
              })}`}
              onClick={onButtonClick}
            >
              {text}
            </Button>
          </>
        ),
      ],
    ],
  });

  return (
    <Notice
      className="GetFirefoxBanner"
      dismissible
      id="GetFirefoxBanner-notice"
      type="none"
    >
      {bannerContent}
    </Notice>
  );
};

function mapStateToProps(state: AppState): PropsFromState {
  return {
    userAgentInfo: state.api.userAgentInfo,
  };
}

const GetFirefoxBanner: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(GetFirefoxBannerBase);

export default GetFirefoxBanner;
