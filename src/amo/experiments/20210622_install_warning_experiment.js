/* @flow */
import { isFirefox } from 'amo/utils/compatibility';
import type { ExperimentConfig } from 'amo/withExperiment';

export const VARIANT_CURRENT = 'do-not-show-warning';
export const VARIANT_NEW = 'show-warning';

export const EXPERIMENT_CONFIG: ExperimentConfig = {
  id: '20210622_install_warning_experiment',
  variants: [
    { id: VARIANT_CURRENT, percentage: 0.5 },
    { id: VARIANT_NEW, percentage: 0.5 },
  ],
  // Exclude Firefox users.
  shouldExcludeUser({ state }) {
    const { userAgentInfo } = state.api;
    return isFirefox({ userAgentInfo });
  },
};
