/* @flow */
import { SEARCH_SORT_POPULAR, SEARCH_SORT_RECOMMENDED } from 'amo/constants';
import { convertFiltersToQueryParams } from 'amo/searchUtils';
import { visibleAddonType } from 'amo/utils';

export type GetCategoryResultsPathnameParams = {
  addonType: string,
  slug: string,
};

type GetCategoryResultsLinkToParams = GetCategoryResultsPathnameParams;

export const getCategoryResultsPathname = ({
  addonType,
  slug,
}: GetCategoryResultsPathnameParams) => {
  return `/${visibleAddonType(addonType)}/${slug}/`;
};

export const getCategoryResultsQuery = () => {
  return convertFiltersToQueryParams({
    sort: `${SEARCH_SORT_RECOMMENDED},${SEARCH_SORT_POPULAR}`,
  });
};

export const getCategoryResultsLinkTo = ({
  addonType,
  slug,
}: GetCategoryResultsLinkToParams) => {
  return {
    pathname: getCategoryResultsPathname({ addonType, slug }),
    query: getCategoryResultsQuery(),
  };
};
