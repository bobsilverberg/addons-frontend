import * as React from 'react';

import AddonBadges from 'amo/components/AddonBadges';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_FIREFOX,
  RECOMMENDED,
} from 'amo/constants';
import {
  createInternalAddonWithLang,
  createFakeAddon,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  render as defaultRender,
} from 'tests/unit/helpers';
import Badge from 'amo/components/Badge';
import PromotedBadge from 'amo/components/PromotedBadge';
import translate from 'amo/i18n/translate';

jest.mock('amo/i18n/translate', () => {
  /* eslint-disable no-shadow */
  /* eslint-disable global-require */
  const React = require('react');
  const { fakeI18n } = require('tests/unit/helpers');
  /* eslint-enable no-shadow */
  /* eslint-enable global-require */
  return {
    __esModule: true,
    default: () => {
      return (WrappedComponent) => {
        class Translate extends React.Component<any> {
          constructor(props) {
            super(props);

            this.i18n = fakeI18n();
          }

          render() {
            return <WrappedComponent i18n={this.i18n} {...this.props} />;
          }
        }

        return Translate;
      };
    },
  };
});
describe(__filename, () => {
  function render(props) {
    const allProps = {
      i18n: fakeI18n(),
      store: dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX }).store,
      ...props,
    };

    return defaultRender(<AddonBadges {...allProps} />);
  }

  //   it('returns null when there is no add-on', () => {
  //     const { debug, root } = render({ addon: null });
  //     expect(root).toEqual(null);
  //   });

  //   it('displays no badges when none are called for', () => {
  //     const addon = createInternalAddonWithLang({
  //       ...fakeAddon,
  //       type: ADDON_TYPE_EXTENSION,
  //     });
  //     const { debug, root } = render({ addon });
  //     debug();
  //     expect(root.find(Badge)).toHaveLength(0);
  //   });

  it('displays a promoted badge for a promoted add-on', () => {
    // This test is failing becuase i18n in PromotedBage is `undefined`.
    // It has no way (currently) of getting the value of i18n from the test,
    // because it's not passed directly from the AddonBadges component.
    //
    // Maybe we can mock the `connect` and/or `translate` functions to allow
    // it to work?
    //
    // Here's another case where non-shallow rendering is causing complications
    const category = RECOMMENDED;
    const _getPromotedCategory = sinon.stub().returns(category);

    const { debug, root } = render({
      _getPromotedCategory,
      addon: createInternalAddonWithLang(fakeAddon),
    });
    debug();
    expect(root.find(PromotedBadge)).toHaveLength(1);
    expect(root.find(PromotedBadge)).toHaveProp('category', category);
  });

  //   it('does not display a promoted badge for a non-promoted addon', () => {
  //     const _getPromotedCategory = sinon.stub().returns(null);

  //     const root = render({
  //       _getPromotedCategory,
  //       addon: createInternalAddonWithLang(fakeAddon),
  //     });

  //     expect(root.find(PromotedBadge)).toHaveLength(0);
  //   });

  //   it('displays a badge when the addon needs restart', () => {
  //     const addon = createInternalAddonWithLang(
  //       createFakeAddon({
  //         files: [{ is_restart_required: true }],
  //       }),
  //     );
  //     const root = render({ addon });

  //     expect(root.find(Badge)).toHaveProp('type', 'restart-required');
  //     expect(root.find(Badge)).toHaveProp('label', 'Restart Required');
  //   });

  //   it('does not display the "restart required" badge when addon does not need restart', () => {
  //     const addon = createInternalAddonWithLang(
  //       createFakeAddon({
  //         files: [{ is_restart_required: false }],
  //       }),
  //     );
  //     const root = render({ addon });

  //     expect(root.find(Badge)).toHaveLength(0);
  //   });

  //   it('does not display the "restart required" badge when isRestartRequired is not true', () => {
  //     const root = render({
  //       addon: createInternalAddonWithLang(fakeAddon),
  //     });

  //     expect(root.find(Badge).find({ type: 'restart-required' })).toHaveLength(0);
  //   });

  //   it('displays a badge when the addon is experimental', () => {
  //     const addon = createInternalAddonWithLang(
  //       createFakeAddon({
  //         is_experimental: true,
  //       }),
  //     );
  //     const root = render({ addon });

  //     expect(root.find(Badge)).toHaveProp('type', 'experimental');
  //     expect(root.find(Badge)).toHaveProp('label', 'Experimental');
  //   });

  //   it('does not display a badge when the addon is not experimental', () => {
  //     const addon = createInternalAddonWithLang(
  //       createFakeAddon({
  //         is_experimental: false,
  //       }),
  //     );
  //     const root = render({ addon });

  //     expect(root.find(Badge).find({ type: 'experimental' })).toHaveLength(0);
  //   });

  //   describe('Quantum compatible badge', () => {
  //     it('does not display a badge when add-on is compatible with Quantum', () => {
  //       const addon = createInternalAddonWithLang(
  //         createFakeAddon({
  //           files: [
  //             {
  //               is_webextension: true,
  //             },
  //           ],
  //           compatibility: {
  //             [CLIENT_APP_FIREFOX]: {
  //               max: '*',
  //               min: '53.0',
  //             },
  //           },
  //           is_strict_compatibility_enabled: false,
  //         }),
  //       );

  //       const root = render({ addon });

  //       expect(root.find(Badge).find({ type: 'not-compatible' })).toHaveLength(0);
  //     });

  //     it('displays a badge when the addon is not compatible with Quantum', () => {
  //       const addon = createInternalAddonWithLang(
  //         createFakeAddon({
  //           files: [
  //             {
  //               is_mozilla_signed_extension: false,
  //               is_webextension: false,
  //             },
  //           ],
  //           compatibility: {
  //             [CLIENT_APP_FIREFOX]: {
  //               max: '56.*',
  //               min: '30.0a1',
  //             },
  //           },
  //           is_strict_compatibility_enabled: true,
  //         }),
  //       );

  //       const root = render({ addon });

  //       expect(root.find(Badge)).toHaveLength(1);
  //       expect(root.find(Badge)).toHaveProp('type', 'not-compatible');
  //       expect(root.find(Badge)).toHaveProp(
  //         'label',
  //         'Not compatible with Firefox Quantum',
  //       );
  //     });

  //     it('does not display a badge for add-ons that are not extensions', () => {
  //       const addon = createInternalAddonWithLang(
  //         createFakeAddon({
  //           files: [
  //             {
  //               is_webextension: false,
  //             },
  //           ],
  //           type: ADDON_TYPE_STATIC_THEME,
  //           compatibility: {
  //             [CLIENT_APP_FIREFOX]: {
  //               max: '56.*',
  //               min: '30.0a1',
  //             },
  //           },
  //           is_strict_compatibility_enabled: true,
  //         }),
  //       );

  //       const root = render({ addon });

  //       expect(root.find(Badge)).toHaveLength(0);
  //     });
  //   });

  //   it('displays a badge when the addon requires payment', () => {
  //     const addon = createInternalAddonWithLang(
  //       createFakeAddon({
  //         requires_payment: true,
  //       }),
  //     );
  //     const root = render({ addon });

  //     expect(root.find(Badge)).toHaveProp('type', 'requires-payment');
  //     expect(root.find(Badge)).toHaveProp(
  //       'label',
  //       'Some features may require payment',
  //     );
  //   });

  //   it('does not display a badge when the addon does not require payment', () => {
  //     const addon = createInternalAddonWithLang(
  //       createFakeAddon({
  //         requires_payment: false,
  //       }),
  //     );
  //     const root = render({ addon });

  //     expect(root.find(Badge).find({ type: 'requires-payment' })).toHaveLength(0);
  //   });
});
