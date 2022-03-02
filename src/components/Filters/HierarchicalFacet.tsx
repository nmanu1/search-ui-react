import { DisplayableFacet, FacetOption } from '@yext/answers-headless-react';
import { ReactNode, useState } from 'react';
import { CompositionMethod } from '../../hooks';
import { useComposedCssClasses } from '../../hooks/useComposedCssClasses';
import { HierarchicalFacetNode, HierarchicalFacetTree, useHierarchicalFacetTree } from '../../hooks/useHierarchicalFacetTree';
import { useFiltersContext } from './FiltersContext';

/**
 * Props for {@link Filters.HierarchicalFacet}
 *
 * @public
 */
export interface HierarchicalFacetProps {
  /** The `DisplayableFacet` to render as a HierarchicalFacet */
  facet: DisplayableFacet,
  /** The divider for determining hierarchies, defaults to "\>" */
  divider?: string,
  /** The maximum number of options to render before displaying the "Show more/less" button. Defaults to 4 */
  showMoreLimit?: number,
  /** CSS classes for customizing the component styling of {@link Filters.HierarchicalFacetCssClasses} */
  customCssClasses?: HierarchicalFacetCssClasses,
  /** {@inheritDoc CompositionMethod} */
  cssCompositionMethod?: CompositionMethod,
}

/**
 * The CSS class interface for {@link Filters.HierarchicalFacet}.
 *
 * @public
 */
export interface HierarchicalFacetCssClasses {
  container?: string,
  allCategoriesOption___active?: string,
  allCategoriesOption___inactive?: string,
  availableOption?: string,
  parentCategory?: string,
  currentCategory?: string,
  showMoreButton?: string
}

const builtInCssClasses: Required<HierarchicalFacetCssClasses> = {
  container: 'flex flex-col items-start',
  allCategoriesOption___active: 'font-semibold mb-2 text-sm',
  allCategoriesOption___inactive: 'mb-2 text-sm',
  availableOption: 'ml-4 mb-2 text-sm',
  parentCategory: 'mb-2 text-sm',
  currentCategory: 'font-semibold mb-2 text-sm',
  showMoreButton: 'ml-4 text-sm font-medium text-primary-600'
};

/**
 * A HierarchicalFacet takes a `DisplayableFacet` and renders the facet in a way
 * to represent multiple levels of "hierarchies".
 *
 * The hierarchies are determined by the provided divider, which defaults to "\>".
 *
 * @public
 */
export function HierarchicalFacet({
  facet,
  divider = '>',
  showMoreLimit = 4,
  customCssClasses,
  cssCompositionMethod
}: HierarchicalFacetProps): JSX.Element {
  const cssClasses = useComposedCssClasses(
    builtInCssClasses, customCssClasses, cssCompositionMethod);
  const tree = useHierarchicalFacetTree(facet, divider);
  const [isShowingMore, setIsShowingMore] = useState(false);
  const resetShowMore = () => setIsShowingMore(false);

  /** Iteratively parses the `HierarchicalFacetTree` into an array of ReactNodes */
  function renderTree(): ReactNode[] {
    let treePointer: HierarchicalFacetTree = tree;
    const renderedNodesAndShowMoreButton: ReactNode[] = [renderAllCategoriesButton()];

    while (treePointer) {
      const childNodes = Object.values(treePointer);
      const selectedChildNode = childNodes.find(n => n.selected);

      if (!selectedChildNode) {
        renderedNodesAndShowMoreButton.push(...renderAvailableOptions(childNodes));
        if (childNodes.length > showMoreLimit) {
          renderedNodesAndShowMoreButton.push(renderShowMoreButton());
        }
        break;
      }

      renderedNodesAndShowMoreButton.push(renderCategory(selectedChildNode, facet.fieldId));
      treePointer = selectedChildNode.childTree;
    }

    return renderedNodesAndShowMoreButton;
  }

  function renderAllCategoriesButton() {
    return (
      <AllCategories
        key='_AllCategories'
        activeClassName={cssClasses.allCategoriesOption___active}
        inactiveClassName={cssClasses.allCategoriesOption___inactive}
        facet={facet}
        resetShowMore={resetShowMore}
      />
    );
  }

  function renderAvailableOptions(childNodes: HierarchicalFacetNode[]) {
    const nodesToRender = isShowingMore ? childNodes : childNodes.slice(0, showMoreLimit);
    return nodesToRender.map(n =>
      <AvailableOption
        key={n.lastDisplayNameToken}
        className={cssClasses.availableOption}
        fieldId={facet.fieldId}
        facetOption={n.facetOption}
        displayName={n.lastDisplayNameToken}
        resetShowMore={resetShowMore}
      />
    );
  }

  function renderShowMoreButton() {
    return <ShowMoreButton
      key='_ShowMoreButton'
      className={cssClasses.showMoreButton}
      isShowingMore={isShowingMore}
      toggleShowMore={() => setIsShowingMore(!isShowingMore)}
    />;
  }

  function renderCategory(selectedNode: HierarchicalFacetNode, fieldId: string) {
    const sharedProps = {
      key: selectedNode.lastDisplayNameToken,
      resetShowMore,
      selectedNode,
      fieldId
    };

    if (selectedNode.hasSelectedChild) {
      return <ParentCategory className={cssClasses.parentCategory} {...sharedProps}/>;
    } else {
      return <CurrentCategory className={cssClasses.currentCategory} {...sharedProps}/>;
    }
  }

  return (
    <div className={cssClasses.container}>
      {renderTree()}
    </div>
  );
}

/**
 * A hard-coded "All Categories" button that can be used to reset the HierarchicalFacet
 * to its initial state, i.e. with no options selected.
 */
function AllCategories({ facet, inactiveClassName, activeClassName, resetShowMore }: {
  facet: DisplayableFacet,
  activeClassName?: string,
  inactiveClassName?: string,
  resetShowMore: () => void
}) {
  const { applyFilters, handleFilterSelect } = useFiltersContext();

  if (facet.options.find(o => o.selected)) {
    return (
      <button
        className={inactiveClassName}
        onClick={() => {
          facet.options
            .filter(o => o.selected)
            .forEach(o => handleFilterSelect({ fieldId: facet.fieldId, ...o }, false));
          applyFilters();
          resetShowMore();
        }}
      >
        All Categories /
      </button>
    );
  }

  return (
    <div className={activeClassName}>All Categories</div>
  );
}

/** A currently unselected option that is available for selection. */
function AvailableOption({ fieldId, facetOption, displayName, className, resetShowMore }: {
  fieldId: string,
  facetOption: FacetOption,
  displayName: string,
  className?: string,
  resetShowMore: () => void
}) {
  const { applyFilters, handleFilterSelect } = useFiltersContext();

  return (
    <button
      className={className}
      onClick={() => {
        handleFilterSelect({ fieldId, ...facetOption }, true);
        applyFilters();
        resetShowMore();
      }}
    >
      {displayName}
    </button>
  );
}

/** A parent category that is not the most immediate one. */
function ParentCategory({ fieldId, selectedNode, className, resetShowMore }: {
  fieldId: string,
  selectedNode: HierarchicalFacetNode,
  className?: string,
  resetShowMore: () => void
}) {
  const { applyFilters, handleFilterSelect } = useFiltersContext();

  function deselectChildOptions(node: HierarchicalFacetNode) {
    const tree = node.childTree;
    Object.values(tree).forEach(n => {
      handleFilterSelect({ fieldId, ...n.facetOption }, false);
      deselectChildOptions(n);
    });
  }

  return (
    <button className={className} onClick={() => {
      deselectChildOptions(selectedNode);
      applyFilters();
      resetShowMore();
    }}>
      {selectedNode.lastDisplayNameToken + ' /'}
    </button>
  );
}

/** The currently selected category, i.e. the most immediate category. */
function CurrentCategory({ fieldId, selectedNode, className, resetShowMore }: {
  fieldId: string,
  selectedNode: HierarchicalFacetNode,
  className?: string,
  resetShowMore: () => void
}) {
  const { applyFilters, handleFilterSelect } = useFiltersContext();

  return (
    <button
      className={className}
      onClick={() => {
        handleFilterSelect({ fieldId, ...selectedNode.facetOption }, false);
        applyFilters();
        resetShowMore();
      }}
    >
      {selectedNode.lastDisplayNameToken}
    </button>
  );
}

/** The "Show more/less" button for hiding/showing additional `AvailableOption`s */
function ShowMoreButton({ className, isShowingMore, toggleShowMore }: {
  className?: string
  isShowingMore: boolean,
  toggleShowMore: () => void
}) {
  return (
    <button className={className} onClick={toggleShowMore}>
      {isShowingMore ? 'Show less' : 'Show more'}
    </button>
  );
}