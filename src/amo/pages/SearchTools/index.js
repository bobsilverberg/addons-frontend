/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { ADDON_TYPE_EXTENSION, SEARCH_SORT_TOP_RATED } from 'amo/constants';
import translate from 'amo/i18n/translate';
import { makeQueryString } from 'amo/api';
import { sendServerRedirect } from 'amo/reducers/redirectTo';
import { getCategoryResultsPathname } from 'amo/utils/categories';
import type { AppState } from 'amo/store';
import type { DispatchFunc } from 'amo/types/redux';

type Props = {|
  clientApp: string,
  dispatch: DispatchFunc,
  lang: string,
|};

export class SearchToolsBase extends React.Component<Props> {
  constructor(props: Props) {
    super(props);

    const { clientApp, dispatch, lang } = props;

    const pathname = getCategoryResultsPathname({
      addonType: ADDON_TYPE_EXTENSION,
      slug: 'search-tools',
    });

    dispatch(
      sendServerRedirect({
        status: 301,
        url: `/${lang}/${clientApp}${pathname}${makeQueryString({
          sort: SEARCH_SORT_TOP_RATED,
        })}`,
      }),
    );
  }

  // This will never be called, as we always do a server redirect in the
  // constructor.
  render() {
    return null;
  }
}

export function mapStateToProps(state: AppState) {
  return {
    clientApp: state.api.clientApp,
    lang: state.api.lang,
  };
}

const SearchTools: React.ComponentType<Props> = compose(
  translate(),
  connect(mapStateToProps),
)(SearchToolsBase);

export default SearchTools;
