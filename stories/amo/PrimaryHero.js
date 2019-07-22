/* @flow */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { fakeI18n } from 'tests/unit/helpers';

import { PrimaryHeroBase } from 'amo/components/PrimaryHero';

const render = (moreProps = {}) => {
  const props = {
    size: 'large',
    ...moreProps,
  };
  return (
    <PrimaryHeroBase i18n={fakeI18n({ includeJedSpy: false })} {...props} />
  );
};

storiesOf('PrimaryHero', module).addWithChapters('all variants', {
  chapters: [
    {
      sections: [
        {
          title: 'size="large"',
          sectionFn: () => render({ size: 'large' }),
        },
      ],
    },
  ],
});
