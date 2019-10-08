/* @flow */
import makeClassName from 'classnames';
import config from 'config';
import * as React from 'react';
import { withRouter } from 'react-router-dom';

import AppBanner from 'amo/components/AppBanner';
import Header from 'amo/components/Header';
import type { ReactRouterLocationType } from 'core/types/router';

import './styles.scss';

type Props = {|
  children: React.Node,
  contentClassName?: string,
  contentProps?: { [name: string]: any },
  ContentComponentType?: any,
  isHomePage?: boolean,
|};

type InternalProps = {|
  ...Props,
  _config: typeof config,
  location: ReactRouterLocationType,
|};

export const PageBase = ({
  _config = config,
  children,
  contentClassName,
  contentProps = {},
  ContentComponentType = 'div',
  isHomePage = false,
  location,
}: InternalProps) => {
  return (
    <>
      <Header isHomePage={isHomePage} location={location} />
      <div
        className={makeClassName('Page', { 'Page-not-homepage': !isHomePage })}
      >
        {// Exclude the AppBanner from the home page if it will be
        // included via HeroRecommendation.
        (!isHomePage || !_config.get('enableFeatureHeroRecommendation')) && (
          <AppBanner />
        )}
        <ContentComponentType className={contentClassName} {...contentProps}>
          {children}
        </ContentComponentType>
      </div>
    </>
  );
};

const Page: React.ComponentType<Props> = withRouter(PageBase);

export default Page;
