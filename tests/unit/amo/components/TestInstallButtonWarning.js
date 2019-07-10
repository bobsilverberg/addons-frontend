import * as React from 'react';

import InstallButtonWarning, {
  EXPERIMENT_CATEGORY_SHOW,
  EXPERIMENT_ID,
  INSTALL_WARNING_EXPERIMENT_DIMENSION,
  VARIANT_INCLUDE_WARNING,
  VARIANT_EXCLUDE_WARNING,
  couldShowWarning,
  InstallButtonWarningBase,
} from 'amo/components/InstallButtonWarning';
import { setInstallState } from 'core/actions/installations';
import { INSTALLED, UNKNOWN } from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import {
  createFakeTracking,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  fakeInstalledAddon,
  getFakeLogger,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import Notice from 'ui/components/Notice';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const render = (props = {}) => {
    return shallowUntilTarget(
      <InstallButtonWarning
        addon={createInternalAddon(fakeAddon)}
        experimentEnabled
        i18n={fakeI18n()}
        store={store}
        variant={VARIANT_INCLUDE_WARNING}
        {...props}
      />,
      InstallButtonWarningBase,
    );
  };

  const _setInstallStatus = ({ addon, status }) => {
    store.dispatch(
      setInstallState({
        ...fakeInstalledAddon,
        guid: addon.guid,
        status,
      }),
    );
  };

  describe('couldShowWarning', () => {
    it('returns true if the add-on is not recommended, has a status of UNKNOWN, and the experiment is enabled', () => {
      expect(
        couldShowWarning({
          addonIsRecommended: false,
          experimentEnabled: true,
          installStatus: UNKNOWN,
        }),
      ).toEqual(true);
    });

    it('returns false if the add-on is recommended', () => {
      expect(
        couldShowWarning({
          addonIsRecommended: true,
          experimentEnabled: true,
          installStatus: UNKNOWN,
        }),
      ).toEqual(false);
    });

    it('returns false if the addon does not have a status of UNKNOWN', () => {
      expect(
        couldShowWarning({
          addonIsRecommended: false,
          experimentEnabled: true,
          installStatus: INSTALLED,
        }),
      ).toEqual(false);
    });

    it('returns false if the experiment is disabled', () => {
      expect(
        couldShowWarning({
          addonIsRecommended: false,
          experimentEnabled: false,
          installStatus: UNKNOWN,
        }),
      ).toEqual(false);
    });
  });

  it('sets a dimension on mount if a variant exists', () => {
    const _tracking = createFakeTracking();
    const variant = VARIANT_INCLUDE_WARNING;

    render({ _tracking, variant });

    sinon.assert.calledWith(_tracking.setDimension, {
      dimension: INSTALL_WARNING_EXPERIMENT_DIMENSION,
      value: variant,
    });
  });

  it('does not set a dimension on mount if a variant does not exist', () => {
    const _log = getFakeLogger();
    const _tracking = createFakeTracking();

    render({ _log, _tracking, variant: undefined });

    sinon.assert.notCalled(_tracking.setDimension);
    sinon.assert.calledWith(
      _log.debug,
      `No variant set for experiment "${EXPERIMENT_ID}"`,
    );
  });

  it('passes installStatus to couldShowWarning on mount', () => {
    const _couldShowWarning = sinon.spy();
    const isRecommended = false;
    const experimentEnabled = true;
    const installStatus = UNKNOWN;
    const addon = { ...fakeAddon, is_recommended: isRecommended };
    _setInstallStatus({ addon, status: installStatus });

    render({
      _couldShowWarning,
      addon: createInternalAddon(addon),
      experimentEnabled,
      variant: VARIANT_INCLUDE_WARNING,
    });

    sinon.assert.calledWith(_couldShowWarning, {
      addonIsRecommended: isRecommended,
      experimentEnabled,
      installStatus,
    });
  });

  it('passes installStatus to couldShowWarning on update', () => {
    const _couldShowWarning = sinon.spy();
    const isRecommended = false;
    const experimentEnabled = true;
    const installStatus = UNKNOWN;
    const addon = { ...fakeAddon, is_recommended: isRecommended };

    const root = render({
      _couldShowWarning,
      addon: createInternalAddon(addon),
      experimentEnabled,
      variant: VARIANT_INCLUDE_WARNING,
    });

    sinon.assert.calledWith(_couldShowWarning, {
      addonIsRecommended: isRecommended,
      experimentEnabled,
      installStatus: undefined,
    });

    _couldShowWarning.resetHistory();

    root.setProps({ installStatus });

    sinon.assert.calledWith(_couldShowWarning, {
      addonIsRecommended: isRecommended,
      experimentEnabled,
      installStatus,
    });
  });

  describe('display tracking event', () => {
    const _tracking = createFakeTracking();
    const variant = VARIANT_INCLUDE_WARNING;

    beforeEach(() => {
      _tracking.sendEvent.resetHistory();
    });

    it('sends the event on mount if couldShowWarning is true and a variant exists', () => {
      const _couldShowWarning = sinon.stub().returns(true);
      const addon = fakeAddon;

      render({
        _couldShowWarning,
        _tracking,
        addon: createInternalAddon(addon),
        variant,
      });

      sinon.assert.calledWith(_tracking.sendEvent, {
        action: variant,
        category: EXPERIMENT_CATEGORY_SHOW,
        label: addon.name,
      });
    });

    it('does not send the event on mount if couldShowWarning is false', () => {
      const _couldShowWarning = sinon.stub().returns(false);

      render({ _couldShowWarning, _tracking, variant });

      sinon.assert.notCalled(_tracking.sendEvent);
    });

    it('does not send the event on mount if a variant is not set', () => {
      const _couldShowWarning = sinon.stub().returns(true);

      render({ _couldShowWarning, _tracking, variant: undefined });

      sinon.assert.notCalled(_tracking.sendEvent);
    });

    it('sends the event on update if installStatus has changed', () => {
      const _couldShowWarning = sinon.stub().returns(true);
      const addon = fakeAddon;
      const installStatus = UNKNOWN;

      const root = render({
        _couldShowWarning,
        _tracking,
        addon: createInternalAddon(addon),
        installStatus: undefined,
        variant,
      });

      _tracking.sendEvent.resetHistory();

      root.setProps({ installStatus });

      sinon.assert.calledWith(_tracking.sendEvent, {
        action: variant,
        category: EXPERIMENT_CATEGORY_SHOW,
        label: addon.name,
      });
    });

    it('does not send the event on update if installStatus has not changed', () => {
      const _couldShowWarning = sinon.stub().returns(true);
      const installStatus = UNKNOWN;
      const addon = fakeAddon;
      _setInstallStatus({ addon, status: installStatus });

      const root = render({
        _couldShowWarning,
        _tracking,
        variant,
      });

      _tracking.sendEvent.resetHistory();

      root.setProps({ installStatus });

      sinon.assert.notCalled(_tracking.sendEvent);
    });
  });

  it('displays a warning if couldShowWarning is true and the user is in the included cohort', () => {
    const _couldShowWarning = sinon.stub().returns(true);

    const root = render({
      _couldShowWarning,
      variant: VARIANT_INCLUDE_WARNING,
    });
    expect(root.find(Notice)).toHaveLength(1);
  });

  it('does not display a warning if couldShowWarning is false', () => {
    const _couldShowWarning = sinon.stub().returns(false);

    const root = render({
      _couldShowWarning,
      variant: VARIANT_INCLUDE_WARNING,
    });
    expect(root.find(Notice)).toHaveLength(0);
  });

  it('does not display a warning if the user is in the excluded cohort', () => {
    const _couldShowWarning = sinon.stub().returns(true);

    const root = render({
      _couldShowWarning,
      variant: VARIANT_EXCLUDE_WARNING,
    });
    expect(root.find(Notice)).toHaveLength(0);
  });
});
