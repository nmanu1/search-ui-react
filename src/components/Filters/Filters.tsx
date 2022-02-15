import { Filter } from '@yext/answers-headless-react';
import { PropsWithChildren } from 'react';
import FiltersContext from './FiltersContext';

export type FiltersProps = PropsWithChildren<{
  handleFilterSelect: (filter: Filter, selected: boolean) => void
}>;

/**
 * Filters is responsible for providing an instance of {@link FiltersContext}.
 */
export default function Filters(props: FiltersProps): JSX.Element {
  const {
    children,
    handleFilterSelect
  } = props;
  const filtersContextInstance = { handleFilterSelect };

  return (
    <FiltersContext.Provider value={filtersContextInstance}>
      {children}
    </FiltersContext.Provider>
  );
}