import { shallow } from 'enzyme';
import * as React from 'react';

import { FIREFOX_USERS, NON_FIREFOX_USERS } from 'amo/constants';
import { storeExperimentVariant } from 'amo/reducers/experiments';
import {
  EXPERIMENT_COOKIE_NAME,
  EXPERIMENT_ENROLLMENT_CATEGORY,
  EXPERIMENT_ID_REGEXP,
  NOT_IN_EXPERIMENT,
  defaultCookieConfig,
  getVariant,
  isUserExcluded,
  withExperiment,
} from 'amo/withExperiment';
// eslint-disable-next-line import/namespace
import * as defaultConfig from 'config/default';
import {
  createFakeTracking,
  dispatchClientMetadata,
  fakeCookies,
  getFakeConfig,
  sampleUserAgent,
  sampleUserAgentParsed,
  userAgentsByPlatform,
} from 'tests/unit/helpers';

describe(__filename, () => {
  class SomeComponentBase extends React.Component {
    render() {
      return <div className="component" />;
    }
  }

  const makeId = (id) => `20210219_${id}`;

  const createExperimentData = ({
    id = 'some-id',
    variantId = 'some-variant-id',
  }) => {
    return { [id]: variantId };
  };

  const renderWithExperiment = ({
    configOverrides = {},
    cookies = fakeCookies(),
    experimentProps,
    props,
    store = dispatchClientMetadata().store,
  } = {}) => {
    const id = (experimentProps && experimentProps.id) || makeId('some-id');
    const allExperimentProps = {
      _config: getFakeConfig({
        experiments: {
          // Enable the experiment by default to ease testing.
          [id]: true,
        },
        ...configOverrides,
      }),
      _tracking: createFakeTracking(),
      id,
      ...experimentProps,
    };

    const SomeComponent = withExperiment({
      id,
      variants: [
        { id: 'some-variant-a', percentage: 0.5 },
        { id: 'some-variant-b', percentage: 0.5 },
      ],
      ...allExperimentProps,
    })(SomeComponentBase);

    // Temporary workaround for supporting the React (stable) Context API.
    // See: https://github.com/mozilla/addons-frontend/issues/6839
    //
    // 1. Render everything
    const root = shallow(<SomeComponent store={store} {...props} />);
    // 2. Get and render the withExperiment HOC (inside withCookies() HOC)
    return shallow(root.props().children(cookies));
  };

  const render = (props = {}) => {
    const root = renderWithExperiment(props);
    // Return the wrapped instance (`SomeComponentBase`)
    // We have to dive twice because of the withCookies HOC and the connect
    // wrapper.
    return root.dive().dive();
  };

  it('calls isUserExcluded to determine whether the current user should be in the experiment', () => {
    const _isUserExcluded = sinon.spy();
    const excludedGroups = [FIREFOX_USERS];
    const lang = 'en-CA';
    const includedLangs = [lang];
    const { store, state } = dispatchClientMetadata({
      lang,
      userAgent: sampleUserAgent,
    });

    render({
      experimentProps: { excludedGroups, includedLangs },
      props: { _isUserExcluded },
      store,
    });

    sinon.assert.calledWith(_isUserExcluded, {
      excludedGroups,
      includedLangs,
      lang,
      userAgentInfo: state.api.userAgentInfo,
    });
  });

  it.each([true, false])(
    'injects a variant prop from a cookie whether a user is excluded or not',
    (isExcluded) => {
      const _isUserExcluded = sinon.stub().returns(isExcluded);
      const id = makeId('test-id');
      const variantId = 'some-variant-id';
      const cookies = fakeCookies({
        get: sinon.stub().returns(createExperimentData({ id, variantId })),
      });

      const root = render({
        cookies,
        experimentProps: { id },
        props: { _isUserExcluded },
      });

      expect(root).toHaveProp('variant', variantId);
    },
  );

  it.each([true, false])(
    'injects a variant prop from the redux store whether a user is excluded or not',
    (isExcluded) => {
      const _isUserExcluded = sinon.stub().returns(isExcluded);
      const { store } = dispatchClientMetadata();
      const id = makeId('test-id');
      const variantId = 'some-variant-id';
      const cookies = fakeCookies({
        get: sinon.stub().returns(undefined),
      });

      store.dispatch(storeExperimentVariant({ id, variant: variantId }));

      const root = render({
        cookies,
        experimentProps: { id },
        props: { _isUserExcluded },
        store,
      });

      expect(root).toHaveProp('variant', variantId);
    },
  );

  // If a cookie exists, we always want to use it, to maintain consistency
  // for the user.
  it('prefers a variant from a cookie to one from the the redux store', () => {
    const { store } = dispatchClientMetadata();
    const id = makeId('test-id');
    const cookieVariant = 'cookie-variant';
    const storeVariant = 'store-variant';
    const cookies = fakeCookies({
      get: sinon
        .stub()
        .returns(createExperimentData({ id, variantId: cookieVariant })),
    });

    store.dispatch(storeExperimentVariant({ id, variant: storeVariant }));

    const root = render({ cookies, experimentProps: { id }, store });

    expect(root).toHaveProp('variant', cookieVariant);
  });

  // Test for https://github.com/mozilla/addons-frontend/issues/10681
  it('injects a newly created variant prop', () => {
    const id = makeId('hero');
    const variantId = 'some-variant-id';
    const cookies = fakeCookies({
      get: sinon.stub().returns(undefined),
    });
    const _getVariant = sinon.stub().returns(variantId);

    const root = render({
      cookies,
      experimentProps: { id },
      props: { _getVariant },
    });

    expect(root).toHaveProp('variant', variantId);
  });

  it('makes the variant NOT_IN_EXPERIMENT if a user should be excluded based on group, and no variant exists (cookie or store)', () => {
    const excludedGroups = [FIREFOX_USERS];
    const { store } = dispatchClientMetadata({
      userAgent: userAgentsByPlatform.mac.firefox57,
    });

    const root = render({ experimentProps: { excludedGroups }, store });

    expect(root).toHaveProp('variant', NOT_IN_EXPERIMENT);
  });

  it('makes the variant NOT_IN_EXPERIMENT if a user should be excluded based on lang, and no variant exists (cookie or store)', () => {
    const includedLangs = ['en-US'];
    const lang = 'en-CA';
    const { store } = dispatchClientMetadata({ lang });

    const root = render({ experimentProps: { includedLangs }, store });

    expect(root).toHaveProp('variant', NOT_IN_EXPERIMENT);
  });

  it('injects an experimentId', () => {
    const id = makeId('injected-id');

    const root = render({ experimentProps: { id } });
    expect(root).toHaveProp('experimentId', id);
  });

  it('injects an isExperimentEnabled prop', () => {
    const root = render();
    expect(root).toHaveProp('isExperimentEnabled', true);
  });

  it('injects an isUserInExperiment prop', () => {
    const id = makeId('test-id');
    const cookies = fakeCookies({
      get: sinon.stub().returns(createExperimentData({ id })),
    });

    const root = render({ cookies, experimentProps: { id } });

    expect(root).toHaveProp('isUserInExperiment', true);
  });

  it('reads the experiment cookie upon render', () => {
    const cookies = fakeCookies();

    render({ cookies });

    sinon.assert.calledWith(cookies.get, EXPERIMENT_COOKIE_NAME);
  });

  it('deletes the data for an experiment from the cookie if the experiment is disabled', () => {
    const experimentId = makeId('thisExperiment');
    const anotherExperimentId = makeId('anotherExperiment');
    const cookies = fakeCookies({
      get: sinon.stub().returns({
        ...createExperimentData({ id: experimentId }),
        ...createExperimentData({ id: anotherExperimentId }),
      }),
    });
    const configOverrides = {
      experiments: {
        [experimentId]: false,
        [anotherExperimentId]: true,
      },
    };

    render({
      configOverrides,
      cookies,
      experimentProps: { id: experimentId },
    });

    sinon.assert.calledWith(
      cookies.set,
      EXPERIMENT_COOKIE_NAME,
      createExperimentData({ id: anotherExperimentId }),
      defaultCookieConfig,
    );
  });

  it('calls getVariant to set a value for a cookie upon construction if needed', () => {
    const id = makeId('hero');
    const cookies = fakeCookies({
      get: sinon.stub().returns(undefined),
    });
    const variants = [
      { id: 'some-variant-a', percentage: 0.5 },
      { id: 'some-variant-b', percentage: 0.5 },
    ];
    const _getVariant = sinon.stub().returns(variants[0].id);

    render({
      cookies,
      experimentProps: { id, variants },
      props: { _getVariant },
    });

    sinon.assert.calledWith(_getVariant, { variants });

    sinon.assert.calledWith(
      cookies.set,
      EXPERIMENT_COOKIE_NAME,
      createExperimentData({ id, variantId: variants[0].id }),
      defaultCookieConfig,
    );
  });

  it('does not use a stored variant if it is not for this experiment', () => {
    const otherExperimentVariant = 'variant-for-another-experiment';
    const thisExperimentVariant = 'variant-for-this-experiment';
    const id = makeId('hero');
    const cookies = fakeCookies({
      get: sinon.stub().returns(undefined),
    });
    const _getVariant = sinon.stub().returns(thisExperimentVariant);
    const { store } = dispatchClientMetadata();

    // Store a variant for a different experiment.
    store.dispatch(
      storeExperimentVariant({
        id: `different_${id}`,
        variant: otherExperimentVariant,
      }),
    );

    const root = render({
      cookies,
      experimentProps: { id },
      props: { _getVariant },
      store,
    });

    // This expected variant comes from the mocked _getVariant.
    expect(root).toHaveProp('variant', thisExperimentVariant);
  });

  it('uses the stored variant for this experiment, even when others are present', () => {
    const otherExperimentVariant = 'variant-for-another-experiment';
    const thisExperimentVariant = 'variant-for-this-experiment';
    const id = makeId('hero');
    const cookies = fakeCookies({
      get: sinon.stub().returns(undefined),
    });
    const { store } = dispatchClientMetadata();

    // Store a variant for this experiment.
    store.dispatch(
      storeExperimentVariant({
        id,
        variant: thisExperimentVariant,
      }),
    );

    // Store a variant for a different experiment.
    store.dispatch(
      storeExperimentVariant({
        id: `different_${id}`,
        variant: otherExperimentVariant,
      }),
    );

    const root = render({
      cookies,
      experimentProps: { id },
      store,
    });

    // This expected variant comes from the store.
    expect(root).toHaveProp('variant', thisExperimentVariant);
  });

  it('does not call getVariant if the user is to be excluded', () => {
    const _getVariant = sinon.spy();
    const _isUserExcluded = sinon.stub().returns(true);
    const cookies = fakeCookies({
      get: sinon.stub().returns(undefined),
    });

    const root = render({
      cookies,
      props: { _getVariant, _isUserExcluded },
    });

    sinon.assert.notCalled(_getVariant);
    expect(root).toHaveProp('variant', NOT_IN_EXPERIMENT);
  });

  it('creates a cookie upon render if the current experiment is not already in the cookie', () => {
    const experimentId = makeId('thisExperiment');
    const anotherExperimentId = makeId('anotherExperiment');
    const configOverrides = {
      experiments: {
        [experimentId]: true,
        [anotherExperimentId]: true,
      },
    };
    const variantId = 'some-variant-id';
    const cookies = fakeCookies({
      get: sinon.stub().returns({
        ...createExperimentData({ id: anotherExperimentId, variantId }),
      }),
    });
    const _getVariant = sinon.stub().returns(variantId);

    render({
      configOverrides,
      cookies,
      experimentProps: { id: experimentId },
      props: { _getVariant },
    });

    sinon.assert.calledWith(
      cookies.set,
      EXPERIMENT_COOKIE_NAME,
      {
        ...createExperimentData({ id: experimentId, variantId }),
        ...createExperimentData({ id: anotherExperimentId, variantId }),
      },
      defaultCookieConfig,
    );
  });

  it('dispatches storeExperimentVariant to store the variant', () => {
    const id = makeId('hero');
    const variantId = 'some-variant-id';
    const cookies = fakeCookies({
      get: sinon.stub().returns(undefined),
    });
    const _getVariant = sinon.stub().returns(variantId);
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.stub(store, 'dispatch');

    render({
      cookies,
      experimentProps: { id },
      props: { _getVariant },
      store,
    });

    sinon.assert.calledWith(
      fakeDispatch,
      storeExperimentVariant({ id, variant: variantId }),
    );
  });

  it('adds an experiment to the cookie, and removes a disabled one, as expected', () => {
    const experimentId = makeId('thisExperiment');
    const anotherExperimentId = makeId('anotherExperiment');
    const configOverrides = {
      experiments: {
        [experimentId]: true,
        [anotherExperimentId]: false,
      },
    };
    const variantId = 'some-variant-id';
    const cookies = fakeCookies({
      get: sinon.stub().returns({
        ...createExperimentData({ id: anotherExperimentId, variantId }),
      }),
    });
    const _getVariant = sinon.stub().returns(variantId);

    render({
      configOverrides,
      cookies,
      experimentProps: { id: experimentId },
      props: { _getVariant },
    });

    sinon.assert.calledWith(
      cookies.set,
      EXPERIMENT_COOKIE_NAME,
      createExperimentData({ id: experimentId, variantId }),
      defaultCookieConfig,
    );
  });

  it('does not update the cookie if the current experiment is already in the cookie', () => {
    const id = makeId('test-id');
    const cookies = fakeCookies({
      get: sinon.stub().returns(createExperimentData({ id })),
    });

    render({
      cookies,
      experimentProps: { id },
    });

    sinon.assert.notCalled(cookies.set);
  });

  it('sends an enrollment event if the experiment is not already present in the cookie', () => {
    const experimentId = makeId('thisExperiment');
    const anotherExperimentId = makeId('anotherExperiment');
    const variantId = 'some-variant-id';
    const cookies = fakeCookies({
      get: sinon
        .stub()
        .returns(createExperimentData({ id: anotherExperimentId })),
    });
    const _getVariant = sinon.stub().returns(variantId);
    const _tracking = createFakeTracking();

    render({
      cookies,
      experimentProps: { _tracking, id: experimentId },
      props: { _getVariant },
    });

    sinon.assert.calledWith(
      _tracking.sendEvent,
      sinon.match({
        action: variantId,
        category: [EXPERIMENT_ENROLLMENT_CATEGORY, experimentId].join(' '),
      }),
    );
  });

  it('does not send an enrollment event if the user is already in the experiment', () => {
    const id = makeId('hero');
    const cookies = fakeCookies({
      get: sinon.stub().returns(createExperimentData({ id })),
    });
    const _tracking = createFakeTracking();

    render({
      cookies,
      experimentProps: { _tracking, id },
    });

    sinon.assert.notCalled(_tracking.sendEvent);
  });

  it('does not send an enrollment event if the experiment is disabled', () => {
    const id = makeId('hero');
    const cookies = fakeCookies({
      get: sinon.stub().returns(undefined),
    });
    const configOverrides = {
      experiments: {
        [id]: false,
      },
    };
    const _tracking = createFakeTracking();

    render({
      configOverrides,
      cookies,
      experimentProps: { _tracking, id },
    });

    sinon.assert.notCalled(_tracking.sendEvent);
  });

  it('allows a custom cookie configuration', () => {
    const id = makeId('custom_cookie_config');
    const variantId = 'some-variant-id';
    const cookies = fakeCookies();
    const cookieConfig = { path: '/test' };
    const _getVariant = sinon.stub().returns(variantId);

    render({
      cookies,
      experimentProps: { id, cookieConfig },
      props: { _getVariant },
    });

    sinon.assert.calledWith(
      cookies.set,
      EXPERIMENT_COOKIE_NAME,
      createExperimentData({ id, variantId }),
      cookieConfig,
    );
  });

  it('sets a display name', () => {
    const SomeComponent = renderWithExperiment();

    expect(SomeComponent.name()).toMatch(/WithExperiment\(SomeComponentBase\)/);
  });

  it('sets isExperimentEnabled prop to false when experiment is disabled by config', () => {
    const id = makeId('disabled_experiment');
    const configOverrides = {
      experiments: {
        [id]: false,
      },
    };

    const root = render({ configOverrides, experimentProps: { id } });
    expect(root).toHaveProp('isExperimentEnabled', false);
  });

  it('sets isUserInExperiment prop to false when the user is not in the experiment', () => {
    const id = makeId('test-id');
    const cookies = fakeCookies({
      get: sinon
        .stub()
        .returns(createExperimentData({ id, variantId: NOT_IN_EXPERIMENT })),
    });

    const root = render({ cookies, experimentProps: { id } });
    expect(root).toHaveProp('isUserInExperiment', false);
  });

  it('sets isUserInExperiment prop to false when the experiment is disabled', () => {
    const id = makeId('disabled_experiment');
    const configOverrides = {
      experiments: {
        [id]: false,
      },
    };

    const root = render({ configOverrides, experimentProps: { id } });
    expect(root).toHaveProp('isUserInExperiment', false);
  });

  it('disables the experiment by default', () => {
    const configOverrides = {
      // No experiment defined.
      experiments: {},
    };

    const root = render({ configOverrides });
    expect(root).toHaveProp('isExperimentEnabled', false);
  });

  it('can handle a null for experiments in the config', () => {
    const configOverrides = { experiments: null };

    const root = render({ configOverrides });
    expect(root).toHaveProp('isExperimentEnabled', false);
  });

  it('throws an exception for a badly formatted experimentId', () => {
    expect(() => {
      render({ experimentProps: { id: 'bad-id' } });
    }).toThrow(/id must match the pattern YYYYMMDD_experiment_id/);
  });

  it('does not have any invalid experiment ids defined in the config', () => {
    // If this test fails it is because an experimentId does not match the
    // expected format of YYYYMMDD_ExperimentName.
    // eslint-disable-next-line import/namespace
    for (const experimentId of Object.keys(defaultConfig.experiments)) {
      expect(EXPERIMENT_ID_REGEXP.test(experimentId)).toEqual(true);
    }
  });

  describe('getVariant', () => {
    const variants = [
      { id: 'some-variant-a', percentage: 0.1 },
      { id: 'some-variant-b', percentage: 0.2 },
      { id: NOT_IN_EXPERIMENT, percentage: 0.7 },
    ];

    it.each([
      [variants[0], 0.01],
      [variants[0], 0.1],
      [variants[1], 0.11],
      [variants[1], 0.3],
      [variants[2], 0.31],
      [variants[2], 0.99],
    ])(
      'assigns variant %s based on a percent of %s',
      (expectedVariant, randomNumber) => {
        const randomizer = sinon.stub().returns(randomNumber);

        expect(getVariant({ randomizer, variants })).toEqual(
          expectedVariant.id,
        );
        sinon.assert.called(randomizer);
      },
    );

    it('throws an exception if the percentages of variants is less than 100%', () => {
      const randomizer = sinon.stub().returns(1);
      const badVariants = [
        { id: 'some-variant-a', percentage: 1 / 3 },
        { id: 'some-variant-b', percentage: 1 / 3 },
      ];

      expect(() => {
        getVariant({ randomizer, variants: badVariants });
      }).toThrow(/The sum of all percentages/);
    });

    it('throws an exception if the percentages of variants is greater than 100%', () => {
      const randomizer = sinon.stub().returns(1);
      const badVariants = [
        { id: 'some-variant-a', percentage: 2 / 3 },
        { id: 'some-variant-b', percentage: 2 / 3 },
      ];

      expect(() => {
        getVariant({ randomizer, variants: badVariants });
      }).toThrow(/The sum of all percentages/);
    });
  });

  describe('isUserExcluded', () => {
    const _isUserExcluded = ({
      _isFirefox = sinon.spy(),
      excludedGroups,
      includedLangs,
      lang,
      userAgentInfo = sampleUserAgentParsed,
    }) => {
      return isUserExcluded({
        _isFirefox,
        excludedGroups,
        includedLangs,
        lang,
        userAgentInfo,
      });
    };

    describe('includedLangs', () => {
      it('does not exclude a user if includedLangs is undefined', () => {
        expect(_isUserExcluded({ includedLangs: undefined })).toEqual(false);
      });

      it('does not exclude a user if includedLangs is an empty array', () => {
        expect(_isUserExcluded({ includedLangs: [] })).toEqual(false);
      });

      it('does not exclude a user if the lang is included in includedLangs', () => {
        const lang = 'en-CA';
        expect(_isUserExcluded({ includedLangs: ['fr', lang], lang })).toEqual(
          false,
        );
      });

      it('excludes a user if the lang is not included in includedLangs', () => {
        const lang = 'en-CA';
        expect(_isUserExcluded({ includedLangs: ['fr'], lang })).toEqual(true);
      });
    });

    it('calls isFirefox to determine whether the user is on Firefox', () => {
      const _isFirefox = sinon.spy();
      const userAgentInfo = sampleUserAgentParsed;

      _isUserExcluded({
        _isFirefox,
        excludedGroups: [FIREFOX_USERS],
        userAgentInfo,
      });

      sinon.assert.calledWith(_isFirefox, { userAgentInfo });
    });

    it('does not exclude a user if excludedGroups is undefined', () => {
      expect(_isUserExcluded({ excludedGroups: undefined })).toEqual(false);
    });

    it('does not exclude a user if excludedGroups is an empty array', () => {
      expect(_isUserExcluded({ excludedGroups: [] })).toEqual(false);
    });

    it('does not exclude a user if an unknown group is included in excludedGroups', () => {
      expect(
        _isUserExcluded({ excludedGroups: ['invalid_group_name'] }),
      ).toEqual(false);
    });

    it('throws an exception if both FIREFOX exclusion groups are specified', () => {
      expect(() => {
        _isUserExcluded({ excludedGroups: [FIREFOX_USERS, NON_FIREFOX_USERS] });
      }).toThrow(
        /Cannot specify both FIREFOX_USERS and NON_FIREFOX_USERS in excludedGroups/,
      );
    });

    describe('FIREFOX_USERS group', () => {
      const excludedGroups = [FIREFOX_USERS];

      it('excludes a user who is on Firefox', () => {
        const _isFirefox = sinon.stub().returns(true);

        expect(_isUserExcluded({ _isFirefox, excludedGroups })).toEqual(true);
      });

      it('does not excludes a user who is not on Firefox', () => {
        const _isFirefox = sinon.stub().returns(false);

        expect(_isUserExcluded({ _isFirefox, excludedGroups })).toEqual(false);
      });
    });

    describe('NON_FIREFOX_USERS group', () => {
      const excludedGroups = [NON_FIREFOX_USERS];

      it('excludes a user who is not on Firefox', () => {
        const _isFirefox = sinon.stub().returns(false);

        expect(_isUserExcluded({ _isFirefox, excludedGroups })).toEqual(true);
      });

      it('does not excludes a user who is on Firefox', () => {
        const _isFirefox = sinon.stub().returns(true);

        expect(_isUserExcluded({ _isFirefox, excludedGroups })).toEqual(false);
      });
    });
  });
});
