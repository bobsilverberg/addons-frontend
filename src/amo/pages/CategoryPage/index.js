/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import HeadLinks from 'amo/components/HeadLinks';
import Page from 'amo/components/Page';
import Search from 'amo/components/Search';
import {
  convertFiltersToQueryParams,
  convertQueryParamsToFilters,
  fixFiltersFromLocation,
} from 'amo/searchUtils';
import { apiAddonType } from 'amo/utils';
import { getCategoryResultsPathname } from 'amo/utils/categories';
import type { AppState } from 'amo/store';
import type { SearchFilters } from 'amo/api/search';
import type { ReactRouterMatchType } from 'amo/types/router';

type Props = {|
  match: {|
    ...ReactRouterMatchType,
    params: {| categorySlug: string, visibleAddonType: string |},
  |},
|};

type PropsFromState = {|
  filters: SearchFilters,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
|};

export class CategoryPageBase extends React.Component<InternalProps> {
  render() {
    const { filters, match } = this.props;
    const { categorySlug, visibleAddonType } = match.params;
    const addonType = apiAddonType(visibleAddonType);
    const filtersForSearch = {
      ...filters,
      addonType,
      category: categorySlug,
    };

    return (
      <Page>
        <HeadLinks />
        <Search
          enableSearchFilters
          filters={filtersForSearch}
          paginationQueryParams={convertFiltersToQueryParams(filters)}
          pathname={getCategoryResultsPathname({
            addonType,
            slug: categorySlug,
          })}
        />
      </Page>
    );
  }
}

function mapStateToProps(state: AppState): PropsFromState {
  const { location } = state.router;

  const filtersFromLocation = convertQueryParamsToFilters(location.query);

  return {
    filters: fixFiltersFromLocation(filtersFromLocation),
  };
}

const CategoryPage: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
)(CategoryPageBase);

export default CategoryPage;
