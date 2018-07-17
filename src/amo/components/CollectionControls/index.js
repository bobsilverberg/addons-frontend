/* @flow */
import * as React from 'react';

import CollectionAddAddon from 'amo/components/CollectionAddAddon';
import CollectionSort from 'amo/components/CollectionSort';
import Card from 'ui/components/Card';
import type {
  CollectionFilters,
  CollectionType,
} from 'amo/reducers/collections';

import './styles.scss';

export type Props = {|
  collection: CollectionType | null,
  editing: boolean,
  filters: CollectionFilters,
|};

export class CollectionControlsBase extends React.Component<Props> {
  render() {
    const { collection, editing, filters } = this.props;

    return (
      <Card className="CollectionControls">
        {editing && (
          <CollectionAddAddon collection={collection} filters={filters} />
        )}
        <CollectionSort
          collection={collection}
          editing={editing}
          filters={filters}
        />
      </Card>
    );
  }
}

const CollectionControls: React.ComponentType<Props> = CollectionControlsBase;

export default CollectionControls;
