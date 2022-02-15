import { useAnswersState, useAnswersActions, Filter } from '@yext/answers-headless-react';
import { FilterConfig } from './Filters';
import { CompositionMethod, useComposedCssClasses } from '../hooks/useComposedCssClasses';
import Filters, { FiltersCssClasses } from './Filters';

/**
 * Properties for {@link Facets}.
 */
export interface FacetsProps {
  /** Executes a new search whenever a facet selection changes. */
  searchOnChange?: boolean,
  /**
   * {@inheritdoc FilterConfig.searchable}
   * Applies to all groups of facets.
   */
  searchable?: boolean,
  /**
   * {@inheritdoc FilterConfig.collapsible}
   * Applies to all groups of facets.
   */
  collapsible?: boolean,
  /**
   * {@inheritdoc FilterConfig.defaultExpanded}
   * Applies to all groups of facets.
   */
  defaultExpanded?: boolean,
  /** Configurations for individual facet groups. */
  facetConfigs?: Record<string, FacetConfig>,
  /** CSS classes for customizing the component styling. */
  customCssClasses?: FacetsCssClasses,
  /** {@inheritDoc CompositionMethod} */
  cssCompositionMethod?: CompositionMethod
}

/**
 * Configuration for a group of facets.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface FacetConfig extends Omit<FilterConfig, 'options'> {}

/**
 * The CSS class interface used for {@link Facets}.
 */
export interface FacetsCssClasses extends FiltersCssClasses {
  /** Applies to outermost container of Facets. */
  facetsContainer?: string,
  /** Applies to container of Apply button and Reset button. */
  buttonsContainer?: string,
  /** Applies to Apply button and Reset button. */
  button?: string
}

const builtInCssClasses: FacetsCssClasses = {
  facetsContainer: 'md:w-40',
  buttonsContainer: 'flex justify-between mt-5',
  button: 'border border-gray-300 px-2.5 py-1 rounded-md',
};

/**
 * A component that displays a list of selectable facets applicable to the current vertical search.
 *
 * @param props - {@inheritdoc FacetsProps}
 * @returns A React element for the facets
 */
export default function Facets(props: FacetsProps): JSX.Element {
  const {
    searchOnChange,
    searchable,
    collapsible,
    defaultExpanded,
    facetConfigs = {},
    customCssClasses,
    cssCompositionMethod
  } = props;
  const facets = useAnswersState(state => state.filters?.facets) || [];
  const cssClasses = useComposedCssClasses(builtInCssClasses, customCssClasses, cssCompositionMethod);
  const answersActions = useAnswersActions();
  const executeSearch = () => answersActions.executeVerticalQuery();

  const handleResetFacets = () => {
    answersActions.resetFacets();
    if (searchOnChange) {
      executeSearch();
    }
  };

  const onFacetOptionClick = (filter: Filter, selected: boolean) => {
    if (typeof filter.value !== 'string' &&
      typeof filter.value !== 'boolean' &&
      typeof filter.value !== 'number') {
      return;
    }
    const option = {
      matcher: filter.matcher,
      value: filter.value
    };
    answersActions.setFacetOption(filter.fieldId, option, selected);
    if (searchOnChange) {
      executeSearch();
    }
  };

  const filtersConfig = facets
    .filter(facet => facet.options?.length > 0)
    .map(facet => {
      const overrideConfig = facetConfigs?.[facet.fieldId] ?? {};
      const config = {
        searchable,
        collapsible,
        defaultExpanded,
        ...overrideConfig
      };
      const filterOptions = facet.options.map(option => {
        return {
          fieldId: facet.fieldId,
          value: option.value,
          label: `${option.displayName} (${option.count})`,
          isSelected: option.selected,
          onClick: onFacetOptionClick
        };
      });
      return ({
        label: facet.displayName,
        options: filterOptions,
        ...config
      });
    });

  return (
    <div className={cssClasses.facetsContainer}>
      <Filters
        filterConfigs={filtersConfig}
        customCssClasses={customCssClasses}
        cssCompositionMethod={cssCompositionMethod}
      />
      <div className={cssClasses.buttonsContainer}>
        {!searchOnChange && <button onClick={executeSearch} className={cssClasses.button}>Apply</button>}
        <button onClick={handleResetFacets} className={cssClasses.button}>Reset all</button>
      </div>
    </div>
  );
}