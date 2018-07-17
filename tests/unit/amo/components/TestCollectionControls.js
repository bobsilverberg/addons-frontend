import * as React from 'react';

import CollectionControls, {
  CollectionControlsBase,
} from 'amo/components/CollectionControls';
import CollectionSort from 'amo/components/CollectionSort';
import { COLLECTION_SORT_NAME } from 'core/constants';
import {
  createFakeEvent,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = ({ ...otherProps } = {}) => {
    const props = {
      filters: {},
      i18n: fakeI18n(),
      onSortSelect: sinon.stub(),
      ...otherProps,
    };

    return shallowUntilTarget(
      <CollectionControls {...props} />,
      CollectionControlsBase,
    );
  };

  it('renders a CollectionSort component select', () => {
    const filters = { collectionSort: COLLECTION_SORT_NAME };
    const onSortSelect = sinon.stub();

    const root = render({ filters, onSortSelect });

    expect(root.find(CollectionSort)).toHaveProp('filters', filters);
    expect(root.find(CollectionSort)).toHaveProp('onSortSelect', onSortSelect);
  });
});
