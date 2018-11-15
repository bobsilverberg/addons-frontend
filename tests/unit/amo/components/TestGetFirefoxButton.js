import * as React from 'react';

import GetFirefoxButton, {
  GET_FIREFOX_BUTTON_TYPE_ADDON,
  GET_FIREFOX_BUTTON_TYPE_HEADER,
  GetFirefoxButtonBase,
} from 'amo/components/GetFirefoxButton';
import { DOWNLOAD_FIREFOX_URL } from 'amo/constants';
import { makeQueryStringWithUTM } from 'amo/utils';
import { createInternalAddon } from 'core/reducers/addons';
import {
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  shallowUntilTarget,
  userAgents,
} from 'tests/unit/helpers';
import Button from 'ui/components/Button';

describe(__filename, () => {
  function render(props = {}) {
    const { store } = dispatchClientMetadata();

    return shallowUntilTarget(
      <GetFirefoxButton
        buttonType={GET_FIREFOX_BUTTON_TYPE_HEADER}
        i18n={fakeI18n()}
        store={store}
        {...props}
      />,
      GetFirefoxButtonBase,
    );
  }

  describe('On firefox', () => {
    it('renders nothing if the browser is Firefox Desktop', () => {
      const { store } = dispatchClientMetadata({
        userAgent: userAgents.firefox[0],
      });
      const root = render({ store });

      expect(root.find('.GetFirefoxButton')).toHaveLength(0);
    });

    it('renders nothing if the browser is Firefox for Android', () => {
      const { store } = dispatchClientMetadata({
        userAgent: userAgents.firefoxAndroid[0],
      });
      const root = render({ store });

      expect(root.find('.GetFirefoxButton')).toHaveLength(0);
    });

    it('renders nothing if the browser is Firefox for iOS', () => {
      const { store } = dispatchClientMetadata({
        userAgent: userAgents.firefoxIOS[0],
      });
      const root = render({ store });

      expect(root.find('.GetFirefoxButton')).toHaveLength(0);
    });
  });

  describe('Not firefox', () => {
    const { store } = dispatchClientMetadata({
      userAgent: userAgents.chrome[0],
    });

    it('renders a GetFirefoxButton if the browser is not Firefox', () => {
      const root = render({ store });

      expect(root.find('.GetFirefoxButton')).toHaveLength(1);
    });

    it('accepts a custom className', () => {
      const className = 'some-class';
      const root = render({ className, store });

      expect(root.find('.GetFirefoxButton')).toHaveClassName(className);
    });

    describe('addon type', () => {
      const buttonType = GET_FIREFOX_BUTTON_TYPE_ADDON;

      it('sets the href on the button with the guid of the add-on', () => {
        const guid = 'some-guid';
        const addon = createInternalAddon({ ...fakeAddon, guid });
        const root = render({
          addon,
          buttonType,
          store,
        });

        const expectedHref = `${DOWNLOAD_FIREFOX_URL}${makeQueryStringWithUTM({
          utm_content: addon.guid,
        })}`;
        expect(root.find('.GetFirefoxButton')).toHaveProp('href', expectedHref);
      });

      it('sets the button as puffy and not micro', () => {
        const root = render({
          addon: createInternalAddon(fakeAddon),
          buttonType,
          store,
        });

        expect(root.find('.GetFirefoxButton')).toHaveProp('puffy', true);
        expect(root.find('.GetFirefoxButton')).toHaveProp('micro', false);
      });

      it('has the expected button text', () => {
        const root = render({
          addon: createInternalAddon(fakeAddon),
          buttonType,
          store,
        });

        expect(root.children()).toHaveText('Only with Firefox—Get Firefox Now');
      });
    });

    describe('header type', () => {
      const buttonType = GET_FIREFOX_BUTTON_TYPE_HEADER;

      it('sets the href on the button with the expected utm_content for the header', () => {
        const guid = 'some-guid';
        const addon = createInternalAddon({ ...fakeAddon, guid });
        const root = render({
          addon,
          buttonType,
          store,
        });

        const expectedHref = `${DOWNLOAD_FIREFOX_URL}${makeQueryStringWithUTM({
          utm_content: 'header-download-button',
        })}`;
        expect(root.find(Button)).toHaveProp('href', expectedHref);
      });

      it('sets the button as micro and not puffy', () => {
        const root = render({
          addon: createInternalAddon(fakeAddon),
          buttonType,
          store,
        });

        expect(root.find('.GetFirefoxButton')).toHaveProp('puffy', false);
        expect(root.find('.GetFirefoxButton')).toHaveProp('micro', true);
      });

      it('has the expected button text', () => {
        const root = render({
          addon: createInternalAddon(fakeAddon),
          buttonType,
          store,
        });

        expect(root.children()).toHaveText('Download Firefox');
      });
    });
  });
});
