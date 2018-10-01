/* @flow */
/* eslint-disable react/no-unused-prop-types */
import makeClassName from 'classnames';
import { oneLine } from 'common-tags';
import * as React from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import AddonVersionCard from 'amo/components/AddonVersionCard';
import RatingsByStar from 'amo/components/RatingsByStar';
import {
  fetchVersions,
  getLoadingBySlug,
  getVersionsBySlug,
} from 'amo/reducers/versions';
import {
  fetchAddon,
  getAddonBySlug,
  isAddonLoading,
} from 'core/reducers/addons';
import Paginate from 'core/components/Paginate';
import { withFixedErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';
import { getAddonIconUrl } from 'core/imageUtils';
import log from 'core/logger';
import Link from 'amo/components/Link';
import NotFound from 'amo/components/ErrorPage/NotFound';
import Card from 'ui/components/Card';
import CardList from 'ui/components/CardList';
import LoadingText from 'ui/components/LoadingText';
import Rating from 'ui/components/Rating';
import type { AddonVersionType } from 'amo/reducers/versions';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { AddonType } from 'core/types/addons';
import type { DispatchFunc } from 'core/types/redux';
import type {
  ReactRouterHistoryType,
  ReactRouterLocationType,
  ReactRouterMatchType,
} from 'core/types/router';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {|
  location: ReactRouterLocationType,
|};

type InternalProps = {|
  ...Props,
  addon: AddonType | null,
  addonIsLoading: boolean,
  areVersionsLoading: boolean,
  versions?: Array<AddonVersionType>,
  clientApp: string,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  history: ReactRouterHistoryType,
  i18n: I18nType,
  lang: string,
  match: {|
    ...ReactRouterMatchType,
    params: {
      slug: string,
    },
  |},
  pageSize: number | null,
  versionCount?: number,
|};

export class AddonVersionsBase extends React.Component<InternalProps> {
  constructor(props: InternalProps) {
    super(props);

    this.loadDataIfNeeded();
  }

  componentWillReceiveProps(nextProps: InternalProps) {
    this.loadDataIfNeeded(nextProps);
  }

  loadDataIfNeeded(nextProps?: InternalProps) {
    const {
      addon,
      addonIsLoading,
      dispatch,
      errorHandler,
      match: {
        params: { slug },
      },
      versions,
      areVersionsLoading,
    } = {
      ...this.props,
      ...nextProps,
    };

    if (errorHandler.hasError()) {
      log.warn('Not loading data because of an error');
      return;
    }

    if (!addon) {
      if (!addonIsLoading) {
        dispatch(fetchAddon({ slug, errorHandler }));
      }
    }

    let { location } = this.props;
    let locationChanged = false;
    if (nextProps && nextProps.location) {
      if (nextProps.location !== location) {
        locationChanged = true;
      }
      location = nextProps.location;
    }

    if (!areVersionsLoading && (!versions || locationChanged)) {
      dispatch(
        fetchVersions({
          errorHandlerId: errorHandler.id,
          page: this.getCurrentPage(location),
          slug,
        }),
      );
    }
  }

  addonURL() {
    const { addon } = this.props;
    if (!addon) {
      throw new Error('cannot access addonURL() with a falsey addon property');
    }
    return `/addon/${addon.slug}/`;
  }

  url() {
    return `${this.addonURL()}reviews/`;
  }

  getCurrentPage(location: ReactRouterLocationType) {
    return location.query.page || 1;
  }

  render() {
    const {
      addon,
      errorHandler,
      location,
      match: {
        params: { slug },
      },
      i18n,
      pageSize,
      versionCount,
      versions,
    } = this.props;

    if (errorHandler.hasError()) {
      log.warn('Captured API Error:', errorHandler.capturedError);
      // The following code attempts to recover from a 401 returned
      // by fetchAddon() but may accidentally catch a 401 from
      // fetchReviews(). Oh well.
      // TODO: support multiple error handlers, see
      // https://github.com/mozilla/addons-frontend/issues/3101
      //
      // 401 and 403 are for an add-on lookup is made to look like a 404 on purpose.
      // See https://github.com/mozilla/addons-frontend/issues/3061
      if (
        errorHandler.capturedError.responseStatusCode === 401 ||
        errorHandler.capturedError.responseStatusCode === 403 ||
        errorHandler.capturedError.responseStatusCode === 404
      ) {
        return <NotFound />;
      }
    }

    // When versions have not loaded yet, make a list of 4 empty versions
    // as a placeholder.
    const allVersions = versions || Array(4).fill(null);
    const iconUrl = getAddonIconUrl(addon);
    const iconImage = (
      <img
        className="AddonVersions-header-icon-image"
        src={iconUrl}
        alt={i18n.gettext('Add-on icon')}
      />
    );

    let header;
    if (addon) {
      header = i18n.sprintf(i18n.gettext('Version history for %(addonName)s'), {
        addonName: addon.name,
      });
    } else {
      header = <LoadingText />;
    }

    let addonName;
    let versionCountHTML;
    if (addon && versionCountHTML !== null) {
      addonName = <Link to={this.addonURL()}>{addon.name}</Link>;
      versionCountHTML = i18n.sprintf(
        i18n.ngettext(
          '%(addonName)s Version history - %(total)s version',
          '%(addonName)s Version history - %(total)s versions',
          versionCount,
        ),
        {
          addonName: addon.name,
          total: i18n.formatNumber(versionCount),
        },
      );
    } else {
      addonName = <LoadingText />;
      versionCountHTML = <LoadingText />;
    }

    const authorProps = {};
    if (addon && addon.authors) {
      const authorList = addon.authors.map((author) => {
        if (author.url) {
          return oneLine`
            <a
              class="AddonVersions-addon-author-link"
              href="${author.url}"
            >${author.name}</a>`;
        }

        return author.name;
      });
      const title = i18n.sprintf(
        // translators: Example: by The Author, The Next Author
        i18n.gettext('by %(authorList)s'),
        {
          addonName: addon.name,
          authorList: authorList.join(', '),
        },
      );
      authorProps.dangerouslySetInnerHTML = sanitizeHTML(title, ['a', 'span']);
    } else {
      authorProps.children = <LoadingText />;
    }
    /* eslint-disable jsx-a11y/heading-has-content */
    const authorsHTML = (
      <h3 className="AddonVersions-header-authors" {...authorProps} />
    );
    /* eslint-enable jsx-a11y/heading-has-content */

    const paginator =
      addon && versionCount && pageSize && versionCount > pageSize ? (
        <Paginate
          LinkComponent={Link}
          count={versionCount}
          currentPage={this.getCurrentPage(location)}
          pathname={this.url()}
          perPage={pageSize}
        />
      ) : null;

    const metaHeader = (
      <div className="AddonVersions-header">
        <div className="AddonVersions-header-icon">
          {addon ? <Link to={this.addonURL()}>{iconImage}</Link> : iconImage}
        </div>
        <div className="AddonVersions-header-text">
          <h1 className="visually-hidden">{header}</h1>
          <h2 className="AddonVersions-header-addonName">{addonName}</h2>
          {authorsHTML}
        </div>
      </div>
    );

    let addonAverage;
    if (addon && addon.ratings) {
      const averageRating = i18n.formatNumber(addon.ratings.average.toFixed(1));
      addonAverage = i18n.sprintf(
        // translators: averageRating is a localized number, such as 4.5
        // in English or ٤٫٧ in Arabic.
        i18n.gettext('%(averageRating)s star average'),
        { averageRating },
      );
    }

    return (
      <div
        className={makeClassName(
          'AddonVersions',
          addon && addon.type ? [`AddonVersions--${addon.type}`] : null,
        )}
      >
        {addon && (
          <Helmet>
            <title>{header}</title>
          </Helmet>
        )}

        {errorHandler.renderErrorIfPresent()}

        <Card header={metaHeader} className="AddonVersions-addon">
          <div className="AddonVersions-overallRatingStars">
            <Rating
              rating={addon && addon.ratings && addon.ratings.average}
              readOnly
              yellowStars
            />
            <div className="AddonVersions-addonAverage">
              {addon ? addonAverage : <LoadingText minWidth={20} />}
            </div>
          </div>
          <RatingsByStar addon={addon} />
        </Card>

        <div className="AddonVersions-versions">
          {allVersions.length ? (
            <CardList
              className="AddonVersions-reviews-listing"
              footer={paginator}
              header={versionCountHTML}
            >
              <ul>
                {allVersions.map((version, index) => {
                  return (
                    <li key={String(index)}>
                      <AddonVersionCard addon={addon} version={version} />
                    </li>
                  );
                })}
              </ul>
            </CardList>
          ) : null}
        </div>
      </div>
    );
  }
}

export function mapStateToProps(state: AppState, ownProps: InternalProps) {
  const { slug } = ownProps.match.params;
  const versionsData = getVersionsBySlug({ slug, state });

  return {
    addon: getAddonBySlug(state, slug),
    addonIsLoading: isAddonLoading(state, slug),
    clientApp: state.api.clientApp,
    lang: state.api.lang,
    pageSize: versionsData ? versionsData.pageSize : null,
    reviewCount: versionsData && versionsData.reviewCount,
    reviews: versionsData && versionsData.versions,
    areVersionsLoading: getLoadingBySlug({ slug, state }),
  };
}

export const extractId = (ownProps: InternalProps) => {
  const {
    location,
    match: { params },
  } = ownProps;

  return `${params.slug}-${location.query.page || ''}`;
};

const AddonVersions: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(AddonVersionsBase);

export default AddonVersions;
