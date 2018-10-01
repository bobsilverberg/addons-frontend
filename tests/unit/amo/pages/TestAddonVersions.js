import * as React from 'react';

import AddonVersions, {
  AddonVersionsBase,
  extractId,
} from 'amo/pages/AddonVersions';
import {
  createFakeHistory,
  createFakeLocation,
  createStubErrorHandler,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';

describe(__filename, () => {
  const slug = 'some-slug';
  const getProps = ({ ...otherProps } = {}) => ({
    dispatch: sinon.stub(),
    errorHandler: createStubErrorHandler(),
    i18n: fakeI18n(),
    location: createFakeLocation(),
    match: {
      params: {
        slug,
      },
    },
    history: createFakeHistory(),
    store: dispatchClientMetadata().store,
    ...otherProps,
  });

  const render = ({ ...otherProps } = {}) => {
    const allProps = {
      ...getProps(),
      ...otherProps,
    };

    return shallowUntilTarget(
      <AddonVersions {...allProps} />,
      AddonVersionsBase,
    );
  };

  it('renders itself', () => {
    const wrapper = render();

    expect(wrapper.find('.AddonVersions')).toHaveLength(1);
    expect(wrapper.find('.AddonVersions-wrapper')).toHaveLength(1);
  });
});
