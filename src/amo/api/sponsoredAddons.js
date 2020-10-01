/* @flow */
import { callApi } from 'core/api';
import type { ApiState } from 'core/reducers/api';
import type { ExternalSponsoredAddonsShelfType } from 'amo/reducers/home';

export const getSponsoredAddonsShelf = ({
  api,
}: {|
  api: ApiState,
|}): Promise<ExternalSponsoredAddonsShelfType> => {
  return callApi({
    apiState: api,
    auth: true,
    endpoint: 'hero',
    wrapOutgoingLinks: false,
  });
};
