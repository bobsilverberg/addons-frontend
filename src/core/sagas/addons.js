/* @flow */
/* global Generator */
// Disabled because of
// https://github.com/benmosher/eslint-plugin-import/issues/793
/* eslint-disable import/order */
import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
/* eslint-enable import/order */

import { getAddonInfo } from 'amo/api/addonInfo';
import { fetchAddon as fetchAddonFromApi } from 'core/api';
import {
  FETCH_ADDON,
  FETCH_ADDON_INFO,
  loadAddonInfo,
  loadAddonResults,
} from 'core/reducers/addons';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';
import type { GetAddonInfoParams } from 'amo/api/addonInfo';
import type { FetchAddonParams } from 'core/api';
import type {
  FetchAddonAction,
  FetchAddonInfoAction,
} from 'core/reducers/addons';

export function* fetchAddon({
  payload: { errorHandlerId, slug },
}: FetchAddonAction): Generator<any, any, any> {
  const errorHandler = createErrorHandler(errorHandlerId);
  yield put(errorHandler.createClearingAction());
  try {
    const state = yield select(getState);

    const params: FetchAddonParams = { api: state.api, slug };
    const addon = yield call(fetchAddonFromApi, params);

    yield put(loadAddonResults({ addons: [addon] }));
  } catch (error) {
    log.warn(`Failed to load add-on with slug ${slug}: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

export function* fetchAddonInfoAction({
  payload: { errorHandlerId, slug },
}: FetchAddonInfoAction): Generator<any, any, any> {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const params: GetAddonInfoParams = {
      api: state.api,
      slug,
    };
    const info = yield call(getAddonInfo, params);

    yield put(loadAddonInfo({ slug, info }));
  } catch (error) {
    log.warn(`Failed to fetch versions: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

export default function* addonsSaga(): Generator<any, any, any> {
  yield takeEvery(FETCH_ADDON, fetchAddon);
  yield takeLatest(FETCH_ADDON_INFO, fetchAddonInfoAction);
}
