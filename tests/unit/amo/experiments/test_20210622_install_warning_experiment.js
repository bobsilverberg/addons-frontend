import { EXPERIMENT_CONFIG } from 'amo/experiments/20210622_install_warning_experiment';
import { dispatchClientMetadata, userAgents } from 'tests/unit/helpers';

describe(__filename, () => {
  const { shouldExcludeUser } = EXPERIMENT_CONFIG;
  const firefoxBrowsers = [
    ...userAgents.firefox,
    ...userAgents.firefoxAndroid,
    ...userAgents.firefoxIOS,
  ];
  const nonFirefoxBrowsers = [
    ...userAgents.androidWebkit,
    ...userAgents.chromeAndroid,
    ...userAgents.chrome,
  ];

  it.each(firefoxBrowsers)('excludes Firefox users: %s', (userAgent) => {
    const { state } = dispatchClientMetadata({ userAgent });
    expect(shouldExcludeUser({ state })).toEqual(true);
  });

  it.each(nonFirefoxBrowsers)('includes non-Firefox users: %s', (userAgent) => {
    const { state } = dispatchClientMetadata({ userAgent });
    expect(shouldExcludeUser({ state })).toEqual(false);
  });
});
