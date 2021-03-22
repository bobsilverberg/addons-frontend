/* @flow */
import { encode } from 'universal-base64url';
import makeClassName from 'classnames';
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import {
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_FIREFOX,
  DOWNLOAD_FIREFOX_BASE_URL,
  RECOMMENDED,
} from 'amo/constants';
import { makeQueryStringWithUTM } from 'amo/utils';
import { getPromotedCategory } from 'amo/utils/addons';
import translate from 'amo/i18n/translate';
import tracking from 'amo/tracking';
import { isFirefox } from 'amo/utils/compatibility';
import Button from 'amo/components/Button';
import type { AppState } from 'amo/store';
import type { UserAgentInfoType } from 'amo/reducers/api';
import type { AddonType } from 'amo/types/addons';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

export const GET_FIREFOX_BUTTON_TYPE_ADDON: 'GET_FIREFOX_BUTTON_TYPE_ADDON' =
  'GET_FIREFOX_BUTTON_TYPE_ADDON';
export const GET_FIREFOX_BUTTON_TYPE_HEADER: 'GET_FIREFOX_BUTTON_TYPE_HEADER' =
  'GET_FIREFOX_BUTTON_TYPE_HEADER';
export const GET_FIREFOX_BUTTON_TYPE_NONE: 'GET_FIREFOX_BUTTON_TYPE_NONE' =
  'GET_FIREFOX_BUTTON_TYPE_NONE';
export const GET_FIREFOX_BUTTON_CLICK_ACTION = 'download-firefox-click';
export const GET_FIREFOX_BUTTON_CLICK_CATEGORY = 'AMO Download Firefox';

export type GetFirefoxButtonTypeType =
  | typeof GET_FIREFOX_BUTTON_TYPE_ADDON
  | typeof GET_FIREFOX_BUTTON_TYPE_HEADER
  | typeof GET_FIREFOX_BUTTON_TYPE_NONE;

export type Props = {|
  addon?: AddonType,
  buttonType: GetFirefoxButtonTypeType,
  className?: string,
|};

export type DeafultProps = {|
  _encode: typeof encode,
  _getPromotedCategory: typeof getPromotedCategory,
  _tracking: typeof tracking,
|};

type PropsFromState = {|
  clientApp: string,
  userAgentInfo: UserAgentInfoType,
|};

type InternalProps = {|
  ...Props,
  ...DeafultProps,
  ...PropsFromState,
  i18n: I18nType,
|};

export const GetFirefoxButtonBase = ({
  _encode = encode,
  _getPromotedCategory = getPromotedCategory,
  _tracking = tracking,
  addon,
  buttonType,
  className,
  clientApp,
  i18n,
  userAgentInfo,
}: InternalProps): null | React.Node => {
  const promotedCategory = _getPromotedCategory({
    addon,
    clientApp,
    forBadging: true,
  });

  const supportsRTAMO =
    promotedCategory === RECOMMENDED && clientApp === CLIENT_APP_FIREFOX;

  const onButtonClick = () => {
    _tracking.sendEvent({
      action: GET_FIREFOX_BUTTON_CLICK_ACTION,
      category: GET_FIREFOX_BUTTON_CLICK_CATEGORY,
      label: addon ? addon.guid : '',
    });
  };

  if (
    buttonType === GET_FIREFOX_BUTTON_TYPE_NONE ||
    isFirefox({ userAgentInfo })
  ) {
    return null;
  }

  let buttonText;
  let calloutText;
  let micro = false;
  let puffy = false;
  let utmContent;

  switch (buttonType) {
    case GET_FIREFOX_BUTTON_TYPE_ADDON: {
      invariant(
        addon,
        `addon is required for buttonType ${GET_FIREFOX_BUTTON_TYPE_ADDON}`,
      );
      const downloadTextForRTAMO =
        addon.type === ADDON_TYPE_STATIC_THEME
          ? i18n.gettext('Download Firefox and get the theme')
          : i18n.gettext('Download Firefox and get the extension');
      buttonText = supportsRTAMO
        ? downloadTextForRTAMO
        : i18n.gettext('Download Firefox');
      // TODO: This could be extension or theme.
      calloutText =
        addon.type === ADDON_TYPE_STATIC_THEME
          ? i18n.gettext(`You'll need Firefox to use this theme`)
          : i18n.gettext(`You'll need Firefox to use this extension`);
      puffy = true;
      utmContent = addon.guid ? `rta:${_encode(addon.guid)}` : '';
      break;
    }
    case GET_FIREFOX_BUTTON_TYPE_HEADER: {
      buttonText = i18n.gettext('Download Firefox');
      calloutText =
        clientApp === CLIENT_APP_FIREFOX
          ? i18n.gettext(
              `You'll need Firefox to use these extensions and themes`,
            )
          : i18n.gettext(`You'll need Firefox to use these extensions`);

      micro = true;
      utmContent = 'header-download-button';
      break;
    }
    default:
      throw new Error(
        `Cannot pass ${buttonType} as the buttonType prop to GetFirefoxButton`,
      );
  }

  return (
    <div
      className={makeClassName('GetFirefoxButton', {
        'GetFirefoxButton--in-headercallout':
          buttonType === GET_FIREFOX_BUTTON_TYPE_HEADER,
      })}
    >
      <div
        className={makeClassName('GetFirefoxButton-callout', {
          'GetFirefoxButton-callout--top':
            buttonType === GET_FIREFOX_BUTTON_TYPE_ADDON,
          'GetFirefoxButton-callout--left':
            buttonType === GET_FIREFOX_BUTTON_TYPE_HEADER,
        })}
      >
        {calloutText}
      </div>
      <Button
        buttonType="action"
        className={makeClassName('GetFirefoxButton-button', className)}
        href={`${DOWNLOAD_FIREFOX_BASE_URL}${makeQueryStringWithUTM({
          utm_content: utmContent,
        })}`}
        micro={micro}
        onClick={onButtonClick}
        puffy={puffy}
      >
        {buttonText}
      </Button>
    </div>
  );
};

function mapStateToProps(state: AppState): PropsFromState {
  return {
    clientApp: state.api.clientApp,
    userAgentInfo: state.api.userAgentInfo,
  };
}

const GetFirefoxButton: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(GetFirefoxButtonBase);

export default GetFirefoxButton;
