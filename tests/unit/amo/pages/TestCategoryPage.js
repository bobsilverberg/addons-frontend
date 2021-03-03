import * as React from 'react';

import Search from 'amo/components/Search';
import CategoryPage, { CategoryPageBase } from 'amo/pages/CategoryPage';
import {
  ADDON_TYPE_EXTENSION,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
} from 'amo/constants';
import { sendServerRedirect } from 'amo/reducers/redirectTo';
import { visibleAddonType } from 'amo/utils';
import {
  createFakeLocation,
  dispatchClientMetadata,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

  const getParams = (overrides = {}) => {
    return {
      categorySlug: 'some-category',
      visibleAddonType: visibleAddonType(ADDON_TYPE_EXTENSION),
      ...overrides,
    };
  };

  function render({
    location = createFakeLocation(),
    params = getParams(),
    ...props
  } = {}) {
    return shallowUntilTarget(
      <CategoryPage
        location={location}
        match={{ params }}
        store={store}
        {...props}
      />,
      CategoryPageBase,
    );
  }

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  it('renders a Search component', () => {
    const root = render();

    expect(root.find(Search)).toHaveLength(1);
    expect(root.find(Search)).toHaveProp('enableSearchFilters', true);
  });

  it('adds category and addonType to Search filters', () => {
    const category = 'some-category';
    const addonType = ADDON_TYPE_EXTENSION;

    const root = render({
      params: {
        categorySlug: category,
        visibleAddonType: visibleAddonType(addonType),
      },
    });

    expect(root.find(Search).prop('filters')).toEqual({
      addonType,
      category,
    });
  });

  //   it('sets the paginationQueryParams from filters', () => {
  //     const root = render({
  //       location: createFakeLocation({
  //         query: {
  //           page: 2,
  //           q: 'burger',
  //           tag: 'firefox57',
  //         },
  //       }),
  //     });

  //     expect(root.find(Search)).toHaveProp('paginationQueryParams', {
  //       page: 2,
  //       q: 'burger',
  //       tag: 'firefox57',
  //     });
  //   });

  //   it('preserves category in paginationQueryParams', () => {
  //     const query = {
  //       // The API is responsible for defining category strings.
  //       category: 'some-category',
  //     };

  //     const root = render({
  //       location: createFakeLocation({
  //         query: { ...query, q: 'search term' },
  //       }),
  //     });

  //     const params = root.find(Search).prop('paginationQueryParams');
  //     expect(params).toMatchObject(query);
  //   });

  //   it('dispatches a server redirect when `atype` parameter is "1"', () => {
  //     const fakeDispatch = sinon.spy(store, 'dispatch');

  //     render({
  //       location: createFakeLocation({ query: { atype: 1 } }),
  //       store,
  //     });

  //     sinon.assert.calledWith(
  //       fakeDispatch,
  //       sendServerRedirect({
  //         status: 301,
  //         url: '/en-US/android/search/?type=extension',
  //       }),
  //     );
  //     sinon.assert.callCount(fakeDispatch, 1);
  //   });

  //   it('dispatches a server redirect when `atype` parameter is "3"', () => {
  //     const fakeDispatch = sinon.spy(store, 'dispatch');

  //     render({
  //       location: createFakeLocation({ query: { atype: 3 } }),
  //       store,
  //     });

  //     sinon.assert.calledWith(
  //       fakeDispatch,
  //       sendServerRedirect({
  //         status: 301,
  //         url: '/en-US/android/search/?type=dictionary',
  //       }),
  //     );
  //     sinon.assert.callCount(fakeDispatch, 1);
  //   });

  //   it('dispatches a server redirect when `atype` parameter is "5"', () => {
  //     const fakeDispatch = sinon.spy(store, 'dispatch');

  //     render({
  //       location: createFakeLocation({ query: { atype: 5 } }),
  //       store,
  //     });

  //     sinon.assert.calledWith(
  //       fakeDispatch,
  //       sendServerRedirect({
  //         status: 301,
  //         url: '/en-US/android/search/?type=language',
  //       }),
  //     );
  //     sinon.assert.callCount(fakeDispatch, 1);
  //   });

  //   it('does not dispatch a server redirect when `atype` has no mapping', () => {
  //     const fakeDispatch = sinon.spy(store, 'dispatch');

  //     // The `atype` value has no corresponding `addonType`.
  //     render({
  //       location: createFakeLocation({ query: { atype: 123 } }),
  //       store,
  //     });

  //     sinon.assert.notCalled(fakeDispatch);
  //   });

  //   it('dispatches a server redirect when `platform` is set', () => {
  //     const fakeDispatch = sinon.spy(store, 'dispatch');

  //     render({
  //       location: createFakeLocation({ query: { platform: 'whatever' } }),
  //       store,
  //     });

  //     sinon.assert.calledWith(
  //       fakeDispatch,
  //       sendServerRedirect({
  //         status: 301,
  //         url: '/en-US/android/search/',
  //       }),
  //     );
  //     sinon.assert.callCount(fakeDispatch, 1);
  //   });

  //   it('redirects without affecting the other parameters', () => {
  //     const fakeDispatch = sinon.spy(store, 'dispatch');
  //     const query = { page: '123', platform: 'all' };

  //     render({ location: createFakeLocation({ query }), store });

  //     sinon.assert.calledWith(
  //       fakeDispatch,
  //       sendServerRedirect({
  //         status: 301,
  //         url: '/en-US/android/search/?page=123',
  //       }),
  //     );
  //     sinon.assert.callCount(fakeDispatch, 1);
  //   });

  //   describe('mapStateToProps()', () => {
  //     const clientApp = CLIENT_APP_FIREFOX;
  //     const { state } = dispatchClientMetadata({ clientApp });
  //     const location = createFakeLocation({
  //       query: {
  //         page: '2',
  //         q: 'burger',
  //       },
  //     });

  //     it('returns filters based on location (URL) data', () => {
  //       expect(mapStateToProps(state, { location })).toEqual({
  //         clientApp: CLIENT_APP_FIREFOX,
  //         lang: 'en-US',
  //         filters: {
  //           page: '2',
  //           query: 'burger',
  //         },
  //       });
  //     });

  //     it("ignores clientApp in location's queryParams", () => {
  //       const badLocation = {
  //         ...location,
  //         query: { ...location.query, app: CLIENT_APP_ANDROID },
  //       };

  //       expect(mapStateToProps(state, { location: badLocation })).toEqual({
  //         clientApp: CLIENT_APP_FIREFOX,
  //         lang: 'en-US',
  //         filters: {
  //           page: '2',
  //           query: 'burger',
  //         },
  //       });
  //     });

  //     it("ignores lang in location's queryParams", () => {
  //       const badLocation = {
  //         ...location,
  //         query: { ...location.query, lang: 'fr' },
  //       };

  //       expect(mapStateToProps(state, { location: badLocation })).toEqual({
  //         clientApp: CLIENT_APP_FIREFOX,
  //         lang: 'en-US',
  //         filters: {
  //           page: '2',
  //           query: 'burger',
  //         },
  //       });
  //     });
  //   });
});
