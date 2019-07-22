/* @flow */
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import makeClassName from 'classnames';

import AddonTitle from 'amo/components/AddonTitle';
import AddonCompatibilityError from 'amo/components/AddonCompatibilityError';
import { GET_FIREFOX_BUTTON_TYPE_ADDON } from 'amo/components/GetFirefoxButton';
import AddonInstallError from 'amo/components/AddonInstallError';
import InstallButtonWrapper from 'amo/components/InstallButtonWrapper';
import { INSTALL_SOURCE_GUIDES_PAGE } from 'core/constants';
import { getAddonIconUrl } from 'core/imageUtils';
import translate from 'core/i18n/translate';
import Card from 'ui/components/Card';
import RecommendedBadge from 'ui/components/RecommendedBadge';
import type { AddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';
import type { AppState } from 'amo/store';

import placeholder from './img/placeholder.jpg';
import decoration from './img/background-noodle-1.svg';
import './styles.scss';

type Props = {
  addon: AddonType | null | void,
  addonCustomText: string,
};

type InternalProps = {
  ...Props,
  i18n: I18nType,
};

export class PrimaryHeroBase extends React.Component<InternalProps> {
  render() {
    const { i18n } = this.props;
    const addon = {
      name: 'Ghostery',
      desc:
        'Blah, blah, blah. Blah, blah, blah. Blah, blah, blah. Blah, blah, blah. Blah, blah, blah. Blah, blah, blah. Blah, blah, blah. Blah, blah, blah. Blah, blah, blah. Blah, blah, blah. Blah, blah, blah. Blah, blah, blah. Blah, blah, blah.',
    };

    return (
      <Card>
        <div className="PrimaryHero">
          <div className="PrimaryHero-decoration">
            <img alt="" src={decoration} />
          </div>
          <div className="PrimaryHero-image">
            <img alt="" src={placeholder} />
          </div>
          <div className="PrimaryHero-content">
            <div className="PrimaryHero-content-recommended">
              {i18n.gettext('Recommended')}
            </div>
            <div className="PrimaryHero-content-add-on-name">{addon.name}</div>
            <div className="PrimaryHero-content-add-on-desc">{addon.desc}</div>
            <div className="PrimaryHero-content-add-on-link">
              Button goes here.
            </div>
          </div>
        </div>
      </Card>
    );
  }
}

// export const mapStateToProps = (
//   state: AppState,
//   ownProps: Props,
// ): $Shape<InternalProps> => {
//   const { addon } = ownProps;

//   let installedAddon = {};

//   if (addon) {
//     installedAddon = state.installations[addon.guid];
//   }

//   return {
//     installError:
//       installedAddon && installedAddon.error ? installedAddon.error : null,
//   };
// };

const PrimaryHero: React.ComponentType<Props> = compose(translate())(
  PrimaryHeroBase,
);
//   connect(mapStateToProps),

export default PrimaryHero;
