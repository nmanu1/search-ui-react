import { useLayoutEffect } from 'react';
import { useAnswersActions } from '@yext/answers-headless-react';
import {
  AppliedFilters,
  FilterSearch,
  ResultsCount,
  SearchBar,
  StandardCard,
  VerticalResults,
  LocationBias,
  StaticFilters,
  StandardFacets,
  HierarchicalFacets,
  ApplyFiltersButton,
  Pagination,
  NumericalFacets
} from '@yext/answers-react-components';

const hierarchicalFacetFieldIds = ['c_hierarchicalFacet'];

export function PeoplePage() {
  const answersActions = useAnswersActions();
  useLayoutEffect(() => {
    answersActions.setVertical('people');
  });

  return (
    <div>
      <SearchBar />
      <div className='flex'>
        <div className='w-56 shrink-0 mr-5'>
          <FilterSearch
            searchFields={[{ fieldApiName: 'name', entityType: 'ce_person' }]}
            searchOnSelect={true}
            label='Filters'
          />
          <div className='w-full h-px bg-gray-200 my-4' />
          <NumericalFacets searchOnChange={false} />
          <StandardFacets
            searchable={true}
            searchOnChange={false}
            excludedFieldIds={hierarchicalFacetFieldIds}
          />
          <HierarchicalFacets
            collapsible={true}
            searchOnChange={false}
            includedFieldIds={hierarchicalFacetFieldIds}
          />
          <StaticFilters
            fieldId='c_employeeCountry'
            title='Employee Country'
            filterOptions={[
              { value: 'United States' },
              { value: 'UK' }
            ]}
            searchOnChange={false}
          />
          <br />
          <ApplyFiltersButton />
        </div>
        <div className='flex-grow'>
          <div className='flex items-baseline'>
            <ResultsCount />
            <AppliedFilters hierarchicalFacetsFieldIds={hierarchicalFacetFieldIds} />
          </div>
          <VerticalResults
            CardComponent={StandardCard}
          />
          <Pagination />
          <LocationBias />
        </div>
      </div>
    </div>
  );
}
