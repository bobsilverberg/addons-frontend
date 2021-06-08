/* @flow */
import config from 'config';
import invariant from 'invariant';
import * as React from 'react';
import { withCookies, Cookies } from 'react-cookie';
import { connect } from 'react-redux';

import { storeExperimentVariant } from 'amo/reducers/experiments';
import tracking from 'amo/tracking';
import { getDisplayName } from 'amo/utils';
import type { StoredVariant } from 'amo/reducers/experiments';
import type { AppState } from 'amo/store';
import type { DispatchFunc } from 'amo/types/redux';

/*  Usage
 *
 *  To add experiment support to a component, do the following:
 *
 *  1. Include `withExperiment()` in the `compose` function of the component.
 *  2. Set a unique `id` for the experiment in the call to `withExperiment`
 *     (see example below).
 *  3. Define a set of variants for the experiment in the call to
 *     `withExperiment`, each of which will be assigned an `id` and a
 *     `percentage` which represents the portion of users who will be assigned
 *     this variant (see example below).
 *
 *  Note: The sum of all `percentage` values must be exactly 1. An exception
 *        will be thrown if that is not the case.
 *
 *  Note: To create a portion of the user population who will not be enrolled
 *        in the experiment, assign a percentage to the special
 *        `NOT_IN_EXPERIMENT` variant.
 *
 *  Note: Experiments are only executed on the client. The component will
 *        initially be rendered with `variant === null`. Therefore the
 *        version of the component that will be the least disruptive should
 *        be generated when `variant === null`. Once a variant is determined
 *        on the client, the layout of the component will change to match that
 *        of the variant.
 *
 *  Example:
 *
 *     withExperiment({
 *      id: '20210219_some-experiment-id',
 *      variants: [
 *        { id: 'variant-a', percentage: 0.2 },
 *        { id: 'variant-b', percentage: 0.2 },
 *        { id: NOT_IN_EXPERIMENT, percentage: 0.6 },
 *      ],
 *     })
 *
 *  The above will create an experiment where 20% of the users will receive
 *  `variant-a`, 20% of users will receive `variant-b`, and 60% of users will
 *  not be enrolled in the experiment at all.
 *
 */

// This value defaults to 30 days in seconds. This value should not be changed
// unless directed to do so by a requirements change.
// See https://github.com/mozilla/addons-frontend/issues/8515
export const DEFAULT_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;
export const EXPERIMENT_COOKIE_NAME = 'frontend_active_experiments';
export const EXPERIMENT_ENROLLMENT_CATEGORY = 'AMO Experiment Enrollment -';
// This is a special variant value that indicates the the user is not enrolled
// in the experiment.
export const NOT_IN_EXPERIMENT = 'notInExperiment';
export const EXPERIMENT_ID_REGEXP: RegExp = /\d{8}_.+/;

export type WithExperimentInjectedProps = {|
  experimentId: string,
  isExperimentEnabled: boolean,
  isUserInExperiment: boolean,
  variant: string | null,
|};

// https://github.com/reactivestack/cookies/tree/f9beead40a6bebac475d9bf17c1da55418d26751/packages/react-cookie#setcookiename-value-options
type CookieConfig = {|
  maxAge?: number,
  path?: string,
  secure?: boolean,
|};

type ExperimentVariant = {|
  id: string,
  percentage: number,
|};

type withExperimentProps = {|
  _config?: typeof config,
  _tracking?: typeof tracking,
  cookieConfig?: CookieConfig,
  id: string,
  variants: ExperimentVariant[],
|};

type ExpermientVariant = {| id: string, percentage: number |};

type RegisteredExpermients = {| [experimentId: string]: string |};

export const getVariant = ({
  randomizer = Math.random,
  variants,
}: {|
  randomizer?: () => number,
  variants: ExperimentVariant[],
|}): ExpermientVariant => {
  invariant(
    variants.reduce((total, variant) => total + variant.percentage, 0) === 1,
    'The sum of all percentages in `variants` must be 1',
  );

  const randomNumber = randomizer();
  let variantMin = 0;
  let variantMax;
  for (const variant of variants) {
    variantMax = variantMin + variant.percentage;
    if (randomNumber > variantMin && randomNumber <= variantMax) {
      return variant;
    }
    variantMin = variantMax;
  }
  // This should be impossible based on the `invariant` above, but it seems
  // like it's safer to keep it here.
  throw new Error('Unable to allocate a user to a variant');
};

export const isExperimentEnabled = ({
  _config = config,
  id,
}: {|
  _config: typeof config,
  id: string,
|}): boolean => {
  const experiments = _config.get('experiments') || {};
  return experiments[id] === true;
};

type WithExperimentsPropsFromState = {|
  storedVariant: StoredVariant | null,
|};

type withExperimentInternalProps = {|
  ...withExperimentProps,
  ...WithExperimentsPropsFromState,
  _getVariant: typeof getVariant,
  _isExperimentEnabled: typeof isExperimentEnabled,
  cookies: typeof Cookies,
  dispatch: DispatchFunc,
  WrappedComponent: React.ComponentType<any>,
|};

export const defaultCookieConfig: CookieConfig = {
  maxAge: DEFAULT_COOKIE_MAX_AGE,
  path: '/',
  // See https://github.com/mozilla/addons-frontend/issues/8957
  secure: true,
};

export const withExperiment =
  ({
    _config = config,
    _tracking = tracking,
    cookieConfig = defaultCookieConfig,
    id: defaultId,
    variants: defaultVariants,
  }: withExperimentProps): ((
    WrappedComponent: React.ComponentType<any>,
  ) => React.ComponentType<any>) =>
  (WrappedComponent: React.ComponentType<any>) => {
    invariant(defaultId, 'id is required');
    invariant(
      EXPERIMENT_ID_REGEXP.test(defaultId),
      'id must match the pattern YYYYMMDD_experiment_id',
    );
    invariant(defaultVariants, 'variants is required');

    class WithExperiment extends React.Component<withExperimentInternalProps> {
      variant: string | null;

      static defaultProps = {
        _getVariant: getVariant,
        _isExperimentEnabled: isExperimentEnabled,
        id: defaultId,
        variants: defaultVariants,
      };

      static displayName = `WithExperiment(${getDisplayName(
        WrappedComponent,
      )})`;

      initialExperimentSetup(props) {
        const {
          _getVariant,
          _isExperimentEnabled,
          dispatch,
          id,
          storedVariant,
          variants,
        } = props;

        console.log('---- Hello!, we are in initialExperimentSetup!');
        let variant = null;
        const isEnabled = _isExperimentEnabled({ _config, id });
        const registeredExperiments = this.getExperiments();
        const experimentInCookie = this.cookieIncludesExperiment(
          registeredExperiments,
        );
        const addExperimentToCookie = !experimentInCookie;
        console.log('---- variant: ', variant);
        console.log('---- isEnabled: ', isEnabled);
        console.log('---- storedVariant: ', storedVariant);

        if (isEnabled) {
          // Use the variant in the cookie if one exists, otherwise use the
          // variant from the Redux store.
          if (experimentInCookie) {
            variant = registeredExperiments[id];
            console.log('---- variant from cookie: ', variant);
          } else if (storedVariant) {
            variant = storedVariant.variant;
            console.log('---- variant from the store: ', variant);
          }

          console.log('---- addExperimentToCookie: ', addExperimentToCookie);
          // Do we need to store the variant in the cookie?
          if (addExperimentToCookie) {
            // Determine the variant if we don't already have one.
            console.log(
              '---- need to add to cookie, current variant: ',
              variant,
            );
            variant = variant || _getVariant({ variants }).id;
            console.log(
              '---- going to add to cookie, current variant: ',
              variant,
            );

            // If we are on the server, we need to store the variant in the Redux
            // store.
            console.log('---- on server?: ', _config.get('server'));
            if (_config.get('server')) {
              const variantToStore: StoredVariant = {
                id,
                variant,
              };
              console.log(
                '---- on server!, dispatching with: ',
                variantToStore,
              );
              dispatch(
                storeExperimentVariant({ storedVariant: variantToStore }),
              );
            }
          }
        }

        console.log('----- returning: ', {
          addExperimentToCookie,
          registeredExperiments,
          variant,
        });
        return {
          addExperimentToCookie,
          registeredExperiments,
          variant,
        };
      }

      constructor(props: withExperimentInternalProps) {
        super(props);

        // constructor and render were called on the server once, with a value of "current",
        // but then that was recalulated on the client and changed to "new".

        // Then constructor and render were called on the client
        // Then ComponentDidMount was called, and it sucessfully sent an enrollment event
        // and set the cookie.

        // Only problem is that it didn't seem to use the value from the redux store.
        // Maybe constructor doesn't have the property from mapStateToProps yet?

        console.log('---- in constructor, variant: ', this.variant);
        this.variant = this.initialExperimentSetup(props).variant;
        console.log('---- in constructor, variant: ', this.variant);
      }

      componentDidMount() {
        const { _isExperimentEnabled, cookies, dispatch, id } = this.props;

        console.log('---- in componentDidMount, variant: ', this.variant);
        const { addExperimentToCookie, registeredExperiments, variant } =
          this.initialExperimentSetup(this.props);

        console.log('---- in componentDidMount, got: ', {
          addExperimentToCookie,
          registeredExperiments,
          variant,
        });
        const experimentsToStore = { ...registeredExperiments };

        // const isEnabled = _isExperimentEnabled({ _config, id });
        // const registeredExperiments = this.getExperiments();
        // const experimentInCookie = this.cookieIncludesExperiment(
        //   registeredExperiments,
        // );
        // const experimentsToStore = { ...registeredExperiments };

        // Clear any disabled experiments from the cookie.
        let cleanupNeeded = false;
        for (const experimentId of Object.keys(registeredExperiments)) {
          if (!_isExperimentEnabled({ _config, id: experimentId })) {
            delete experimentsToStore[experimentId];
            cleanupNeeded = true;
          }
        }

        console.log(
          '---- in componentDidMount, cleanupNeeded: ',
          cleanupNeeded,
        );
        // TODO: We want to keep all of this code in componentDidMount, both
        // the code that stores/updates the cookie and the code that sends
        // the enrollment event, BUT, we need to move the code that
        // generates the variant to a location where it can be run on
        // the server, and then we also need to store the variant in the
        // redux store.

        if (addExperimentToCookie && variant) {
          // TODO: If we don't have a variant to store, we need to read one
          // from the Redux state.
          // const variantToStore = _getVariant({ variants });
          experimentsToStore[id] = variant;

          if (variant !== NOT_IN_EXPERIMENT) {
            console.log(
              '---- in componentDidMount, sending enrollment event...',
            );

            // Send an enrollment event.
            _tracking.sendEvent({
              _config,
              action: variant,
              category: [EXPERIMENT_ENROLLMENT_CATEGORY, id].join(' '),
            });
          }
        }

        if (cleanupNeeded || addExperimentToCookie) {
          console.log('---- in componentDidMount, setting cookie...');
          cookies.set(EXPERIMENT_COOKIE_NAME, experimentsToStore, cookieConfig);
        }

        // Remove the stored variant from the Redux store.
        dispatch(storeExperimentVariant({ storedVariant: null }));
      }

      getExperiments() {
        const { cookies } = this.props;

        return cookies.get(EXPERIMENT_COOKIE_NAME) || {};
      }

      cookieIncludesExperiment(registeredExperiments: RegisteredExpermients) {
        const { id } = this.props;

        return Object.keys(registeredExperiments).includes(id);
      }

      render() {
        const { _isExperimentEnabled, id, ...props } = this.props;

        const isEnabled = _isExperimentEnabled({ _config, id });

        const exposedProps: WithExperimentInjectedProps = {
          experimentId: id,
          isExperimentEnabled: isEnabled,
          isUserInExperiment:
            this.variant !== null && this.variant !== NOT_IN_EXPERIMENT,
          variant: this.variant,
        };
        console.log('---- in render, exposedProps: ', exposedProps);

        return <WrappedComponent {...exposedProps} {...props} />;
      }
    }

    const mapStateToProps = (
      state: AppState,
    ): WithExperimentsPropsFromState => {
      return {
        storedVariant: state.experiments.storedVariant,
      };
    };

    return withCookies(connect(mapStateToProps)(WithExperiment));
  };
