import * as React from 'react';

import { fetchReview, setReview } from 'amo/actions/reviews';
import FeaturedAddonReview, {
  FeaturedAddonReviewBase,
} from 'amo/components/FeaturedAddonReview';
import AddonReviewCard from 'amo/components/AddonReviewCard';
import { createApiError } from 'core/api';
import { ErrorHandler } from 'core/errorHandler';
import { dispatchClientMetadata, fakeReview } from 'tests/unit/amo/helpers';
import {
  createStubErrorHandler,
  fakeI18n,
  createFakeLocation,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const getProps = ({
    location = createFakeLocation(),
    params,
    ...customProps
  } = {}) => {
    return {
      errorHandler: createStubErrorHandler(),
      i18n: fakeI18n(),
      location,
      store,
      ...customProps,
    };
  };

  const render = ({ ...customProps } = {}) => {
    const props = getProps(customProps);

    return shallowUntilTarget(
      <FeaturedAddonReview {...props} />,
      FeaturedAddonReviewBase,
    );
  };

  it('fetches a review if needed', () => {
    const reviewId = 1;
    const dispatch = sinon.stub(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    render({
      errorHandler,
      reviewId,
    });

    sinon.assert.calledWith(
      dispatch,
      fetchReview({
        reviewId,
        errorHandlerId: errorHandler.id,
      }),
    );
  });

  it('does not fetch a review if one is already loading', () => {
    const reviewId = 1;
    const errorHandler = createStubErrorHandler();
    store.dispatch(fetchReview({ errorHandlerId: errorHandler.id, reviewId }));

    const fakeDispatch = sinon.stub(store, 'dispatch');

    render({
      errorHandler,
      reviewId,
    });

    sinon.assert.neverCalledWith(
      fakeDispatch,
      fetchReview({
        reviewId,
        errorHandlerId: errorHandler.id,
      }),
    );
  });

  it('does not fetch a review if one is already loaded', () => {
    const reviewId = 1;
    const errorHandler = createStubErrorHandler();
    store.dispatch(setReview({ ...fakeReview, id: reviewId }));

    const fakeDispatch = sinon.stub(store, 'dispatch');

    render({
      errorHandler,
      reviewId,
    });

    sinon.assert.neverCalledWith(
      fakeDispatch,
      fetchReview({
        reviewId,
        errorHandlerId: errorHandler.id,
      }),
    );
  });

  it('displays a message if the review is not found', () => {
    const errorHandler = new ErrorHandler({
      id: 'some-error-handler-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(
      createApiError({
        response: { status: 404 },
        apiURL: 'https://some/api/endpoint',
        jsonResponse: { message: 'not found' },
      }),
    );

    const root = render({ errorHandler });
    expect(root.find('.FeaturedAddonReview-notfound')).toHaveLength(1);
  });

  it('displays a featured review', () => {
    const reviewId = 123;
    store.dispatch(setReview({ ...fakeReview, id: reviewId }));

    const root = render({ reviewId });

    const card = root.find(AddonReviewCard);
    expect(card).toHaveLength(1);
    expect(card.prop('review').id).toEqual(reviewId);
  });

  it('displays the correct header for the review', () => {
    const reviewId = 123;
    store.dispatch(setReview({ ...fakeReview, id: reviewId }));

    const root = render({ reviewId });

    expect(root.find('.FeaturedAddonReview-card')).toHaveProp(
      'header',
      `Review by ${fakeReview.user.name}`,
    );
  });
});
