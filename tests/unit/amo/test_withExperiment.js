import config from 'config';
import { shallow } from 'enzyme';
import * as React from 'react';

import {
  EXPERIMENT_COOKIE_NAME,
  EXPERIMENT_ENROLLMENT_CATEGORY,
  EXPERIMENT_ID_REGEXP,
  NOT_IN_EXPERIMENT,
  defaultCookieConfig,
  getRegisteredExperiments,
  getVariant,
  withExperiment,
} from 'amo/withExperiment';
import {
  createFakeTracking,
  fakeCookies,
  fakeVariant,
  getFakeConfig,
} from 'tests/unit/helpers';

describe(__filename, () => {
  class SomeComponentBase extends React.Component {
    render() {
      return <div className="component" />;
    }
  }

  const makeId = (id) => `20210219_${id}`;

  const renderWithExperiment = ({
    props,
    experimentProps,
    cookies = fakeCookies(),
  } = {}) => {
    const id = makeId('some-id');
    const allExperimentProps = {
      id,
      ...experimentProps,
    };

    // Enable the experiment by default to ease testing.
    const _config = getFakeConfig({
      experiments: {
        [allExperimentProps.id]: true,
      },
    });

    const allProps = {
      _config,
      ...props,
    };

    const SomeComponent = withExperiment({
      id,
      variants: [
        { id: 'some-variant-a', percentage: 0.5 },
        { id: 'some-variant-b', percentage: 0.5 },
      ],
      ...experimentProps,
    })(SomeComponentBase);

    // Temporary workaround for supporting the React (stable) Context API.
    // See: https://github.com/mozilla/addons-frontend/issues/6839
    //
    // 1. Render everything
    const root = shallow(<SomeComponent {...allProps} />);
    // 2. Get and render the withExperiment HOC (inside withCookies() HOC)
    return shallow(root.props().children(cookies));
  };

  const render = (props = {}) => {
    const root = renderWithExperiment(props);
    // Return the wrapped instance (`SomeComponentBase`)
    return root.dive();
  };

  it('injects a variant prop', () => {
    const id = makeId('some-id');
    const variantId = 'some-variant-id';
    const _getRegisteredExperiments = sinon.stub().returns({ [id]: variantId });

    const root = render({ id, props: { _getRegisteredExperiments } });

    expect(root).toHaveProp('variant', variantId);
  });

  it('injects an isExperimentEnabled prop', () => {
    const root = render();
    expect(root).toHaveProp('isExperimentEnabled', true);
  });

  it('injects an isUserInExperiment prop', () => {
    const id = makeId('some-id');
    const _getRegisteredExperiments = sinon
      .stub()
      .returns({ [id]: 'some-variant-id' });

    const root = render({ id, props: { _getRegisteredExperiments } });

    expect(root).toHaveProp('isUserInExperiment', true);
  });

  it('calls getRegisteredExperiments to read the cookie upon construction and render', () => {
    const _getRegisteredExperiments = sinon.stub().returns({});
    const cookies = fakeCookies();

    render({ cookies, props: { _getRegisteredExperiments } });

    sinon.assert.alwaysCalledWith(_getRegisteredExperiments, cookies);
    sinon.assert.callCount(_getRegisteredExperiments, 2);
  });

  it('deletes the data for the current experiment from the cookie if the experiment is disabled', () => {
    const experimentId = makeId('thisExperiment');
    const anotherExperimentId = makeId('anotherExperiment');
    const variantId = 'some-variant-id';
    const _getRegisteredExperiments = sinon.stub().returns({
      [experimentId]: variantId,
      [anotherExperimentId]: variantId,
    });
    const cookies = fakeCookies();
    const _config = getFakeConfig({
      experiments: {
        [experimentId]: false,
      },
    });

    render({
      cookies,
      experimentProps: { id: experimentId },
      props: { _config, _getRegisteredExperiments },
    });

    sinon.assert.calledWith(
      cookies.set,
      EXPERIMENT_COOKIE_NAME,
      JSON.stringify({ [anotherExperimentId]: variantId }),
      defaultCookieConfig,
    );
  });

  it('does not delete the data for the current experiment from the cookie if the experiment is disabled and the current experiment is not included in the cookie', () => {
    const experimentId = makeId('thisExperiment');
    const anotherExperimentId = makeId('anotherExperiment');
    const _getRegisteredExperiments = sinon.stub().returns({
      [anotherExperimentId]: 'some-variant-id',
    });
    const cookies = fakeCookies();
    const _config = getFakeConfig({
      experiments: {
        [experimentId]: false,
      },
    });

    render({
      cookies,
      experimentProps: { id: experimentId },
      props: { _config, _getRegisteredExperiments },
    });

    sinon.assert.notCalled(cookies.set);
  });

  it('calls getVariant to set a value for a cookie upon construction if none has been loaded', () => {
    const id = makeId('hero');
    const cookies = fakeCookies({
      get: sinon.stub().returns(undefined),
    });
    const variants = [
      { id: 'some-variant-a', percentage: 0.5 },
      { id: 'some-variant-b', percentage: 0.5 },
    ];
    const _getVariant = sinon.stub().returns(variants[0]);

    render({
      cookies,
      experimentProps: { id, variants },
      props: { _getVariant },
    });

    sinon.assert.calledWith(_getVariant, { variants });

    sinon.assert.calledWith(
      cookies.set,
      EXPERIMENT_COOKIE_NAME,
      JSON.stringify({ [id]: variants[0].id }),
      defaultCookieConfig,
    );
  });

  it('creates a cookie upon construction if the current experiment is not already in the cookie', () => {
    const experimentId = makeId('thisExperiment');
    const anotherExperimentId = makeId('anotherExperiment');
    const variantId = 'some-variant-id';
    const _getRegisteredExperiments = sinon.stub().returns({
      [anotherExperimentId]: variantId,
    });
    const _getVariant = sinon.stub().returns({ ...fakeVariant, id: variantId });

    const cookies = fakeCookies();

    render({
      cookies,
      experimentProps: { id: experimentId },
      props: { _getRegisteredExperiments, _getVariant },
    });

    sinon.assert.calledWith(
      cookies.set,
      EXPERIMENT_COOKIE_NAME,
      JSON.stringify({
        [anotherExperimentId]: variantId,
        [experimentId]: variantId,
      }),
      defaultCookieConfig,
    );
  });

  it('does not update the cookie if the current experiment is already in the cookie', () => {
    const id = makeId('thisExperiment');
    const _getRegisteredExperiments = sinon.stub().returns({
      [id]: 'some-variant-id',
    });

    const cookies = fakeCookies();

    render({
      cookies,
      experimentProps: { id },
      props: { _getRegisteredExperiments },
    });

    sinon.assert.notCalled(cookies.set);
  });

  it('sends an enrollment event upon construction if the experiment is not already present in the cookie', () => {
    const experimentId = makeId('thisExperiment');
    const anotherExperimentId = makeId('anotherExperiment');
    const variantId = 'some-variant-id';
    const _getRegisteredExperiments = sinon.stub().returns({
      [anotherExperimentId]: variantId,
    });
    const _getVariant = sinon.stub().returns({ ...fakeVariant, id: variantId });
    const _tracking = createFakeTracking();

    const cookies = fakeCookies();

    render({
      cookies,
      experimentProps: { _tracking, id: experimentId },
      props: { _getRegisteredExperiments, _getVariant },
    });

    sinon.assert.calledWith(_tracking.sendEvent, {
      action: variantId,
      category: [EXPERIMENT_ENROLLMENT_CATEGORY, experimentId].join(' '),
    });
  });

  it('does not send an enrollment event upon construction if the user is not in the experiment', () => {
    const _getRegisteredExperiments = sinon.stub().returns({});
    const _tracking = createFakeTracking();
    const _getVariant = sinon
      .stub()
      .returns({ ...fakeVariant, id: NOT_IN_EXPERIMENT });

    render({
      experimentProps: { _tracking },
      props: { _getRegisteredExperiments, _getVariant },
    });

    sinon.assert.notCalled(_tracking.sendEvent);
  });

  it('does not send an enrollment event upon construction if the user is in the experiment', () => {
    const id = makeId('hero');
    const _getRegisteredExperiments = sinon.stub().returns({
      [id]: 'some-variant-id',
    });
    const _tracking = createFakeTracking();

    render({
      experimentProps: { _tracking, id },
      props: { _getRegisteredExperiments },
    });

    sinon.assert.notCalled(_tracking.sendEvent);
  });

  it('does not send an enrollment event upon construction if the experiment is disabled', () => {
    const id = makeId('hero');
    const _getRegisteredExperiments = sinon.stub().returns({});
    const _config = getFakeConfig({
      experiments: {
        [id]: false,
      },
    });
    const _tracking = createFakeTracking();

    render({
      props: { _config, _getRegisteredExperiments },
      experimentProps: { _tracking, id },
    });

    sinon.assert.notCalled(_tracking.sendEvent);
  });

  it('allows a custom cookie configuration', () => {
    const id = makeId('custom_cookie_config');
    const cookies = fakeCookies();
    const cookieConfig = { path: '/test' };

    render({
      cookies,
      experimentProps: { id, cookieConfig },
    });

    sinon.assert.calledWith(
      cookies.set,
      EXPERIMENT_COOKIE_NAME,
      sinon.match(id),
      cookieConfig,
    );
  });

  it('sets a display name', () => {
    const SomeComponent = renderWithExperiment();

    expect(SomeComponent.name()).toMatch(/WithExperiment\(SomeComponentBase\)/);
  });

  it('sets isExperimentEnabled prop to false when experiment is disabled by config', () => {
    const id = makeId('disabled_experiment');
    const _config = getFakeConfig({
      experiments: {
        [id]: false,
      },
    });

    const root = render({ props: { _config }, experimentProps: { id } });
    expect(root).toHaveProp('isExperimentEnabled', false);
  });

  it('sets isUserInExperiment prop to false when the user is not in the experiment', () => {
    const id = makeId('some-id');
    const _getRegisteredExperiments = sinon
      .stub()
      .returns({ [id]: NOT_IN_EXPERIMENT });

    const root = render({ id, props: { _getRegisteredExperiments } });
    expect(root).toHaveProp('isUserInExperiment', false);
  });

  it('sets isUserInExperiment prop to false when the experiment is disabled', () => {
    const id = makeId('disabled_experiment');
    const _config = getFakeConfig({
      experiments: {
        [id]: false,
      },
    });

    const root = render({ props: { _config }, experimentProps: { id } });
    expect(root).toHaveProp('isUserInExperiment', false);
  });

  it('disables the experiment by default', () => {
    const _config = getFakeConfig({
      // No experiment defined.
      experiments: {},
    });

    const root = render({ props: { _config } });
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
    for (const experimentId of Object.keys(config.get('experiments'))) {
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

        expect(getVariant({ randomizer, variants })).toEqual(expectedVariant);
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
});
