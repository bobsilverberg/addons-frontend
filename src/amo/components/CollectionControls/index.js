/* @flow */
import * as React from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { compose } from 'redux';

import CollectionSort from 'amo/components/CollectionSort';
import translate from 'core/i18n/translate';
import Card from 'ui/components/Card';
import Notice from 'ui/components/Notice';
import type {
  SearchFilters,
  SuggestionType,
} from 'amo/components/AutoSearchInput';
import type { CollectionFilters } from 'amo/reducers/collections';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

export const MESSAGE_RESET_TIME = 5000;
const MESSAGE_FADEOUT_TIME = 450;

export const ADDON_ADDED_STATUS_PENDING: 'ADDON_ADDED_STATUS_PENDING' =
  'ADDON_ADDED_STATUS_PENDING';
export const ADDON_ADDED_STATUS_SUCCESS: 'ADDON_ADDED_STATUS_SUCCESS' =
  'ADDON_ADDED_STATUS_SUCCESS';

export type AddonAddedStatusType =
  | typeof ADDON_ADDED_STATUS_PENDING
  | typeof ADDON_ADDED_STATUS_SUCCESS;

type State = {|
  addonAddedStatus: AddonAddedStatusType | null,
|};

export type Props = {|
  filters: CollectionFilters,
  onSortSelect: (event: SyntheticEvent<HTMLSelectElement>) => void,
  showSort: boolean,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export class CollectionControlsBase extends React.Component<InternalProps> {
  render() {
    const { filters, i18n, onSortSelect } = this.props;

    return (
      <Card className="CollectionControls">
        <TransitionGroup className="NoticePlaceholder">
          {this.state.addonAddedStatus === ADDON_ADDED_STATUS_SUCCESS && (
            <CSSTransition
              classNames="NoticePlaceholder-transition"
              timeout={MESSAGE_FADEOUT_TIME}
            >
              <Notice type="success">
                {i18n.gettext('Added to collection')}
              </Notice>
            </CSSTransition>
          )}
        </TransitionGroup>

        {!creating && (
          <AutoSearchInput
            inputName="collection-addon-query"
            inputPlaceholder={i18n.gettext(
              'Find an add-on to include in this collection',
            )}
            onSearch={this.onSearchAddon}
            onSuggestionSelected={this.onAddonSelected}
            selectSuggestionText={i18n.gettext('Add to collection')}
          />
        )}

        <CollectionSort filters={filters} onSortSelect={onSortSelect} />
      </Card>
    );
  }
}

const CollectionControls: React.ComponentType<Props> = compose(translate())(
  CollectionControlsBase,
);

export default CollectionControls;
