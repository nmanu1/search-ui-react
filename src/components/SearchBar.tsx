import {
  AnswersHeadless,
  QuerySource,
  SearchTypeEnum,
  UniversalLimit,
  useAnswersActions,
  useAnswersState,
  useAnswersUtilities,
  VerticalResults as VerticalResultsData
} from '@yext/answers-headless-react';
import classNames from 'classnames';
import { Fragment, PropsWithChildren, useCallback, useEffect } from 'react';
import { useEntityPreviews } from '../hooks/useEntityPreviews';
import { useRecentSearches } from '../hooks/useRecentSearches';
import { useSearchWithNearMeHandling } from '../hooks/useSearchWithNearMeHandling';
import { useSynchronizedRequest } from '../hooks/useSynchronizedRequest';
import { VerticalDividerIcon } from '../icons/VerticalDividerIcon';
import { HistoryIcon as RecentSearchIcon } from '../icons/HistoryIcon';
import { CloseIcon } from '../icons/CloseIcon';
import { MagnifyingGlassIcon } from '../icons/MagnifyingGlassIcon';
import { YextIcon } from '../icons/YextIcon';
import { Dropdown } from './Dropdown/Dropdown';
import { useDropdownContext } from './Dropdown/DropdownContext';
import { DropdownInput } from './Dropdown/DropdownInput';
import { DropdownItem } from './Dropdown/DropdownItem';
import { DropdownMenu } from './Dropdown/DropdownMenu';
import { FocusedItemData } from './Dropdown/FocusContext';
import { CompositionMethod, useComposedCssClasses } from '../hooks/useComposedCssClasses';
import {
  calculateEntityPreviewsCount,
  transformEntityPreviews
} from './EntityPreviews';
import { SearchButton } from './SearchButton';
import { processTranslation } from './utils/processTranslation';
import { renderAutocompleteResult,
  AutocompleteResultCssClasses,
  builtInCssClasses as AutocompleteResultBuiltInCssClasses
} from './utils/renderAutocompleteResult';
import { useSearchBarAnalytics } from '../hooks/useSearchBarAnalytics';
import { isVerticalLink, VerticalLink } from '../models/verticalLink';
import { executeAutocomplete as executeAutocompleteSearch } from '../utils/search-operations';
import { clearStaticRangeFilters } from '../utils/filterutils';
import { useMemo } from 'react';

const builtInCssClasses: SearchBarCssClasses = {
  container: 'h-12 mb-6',
  inputDivider: 'border-t border-gray-200 mx-2.5',
  dropdownContainer: 'bg-white py-4 z-10',
  inputContainer: 'inline-flex items-center justify-between w-full',
  inputDropdownContainer: 'relative z-10 bg-white border rounded-3xl border-gray-200 w-full overflow-hidden',
  inputDropdownContainer___active: 'shadow-lg',
  inputElement: 'outline-none flex-grow border-none h-full pl-0.5 pr-2 text-neutral-dark text-base placeholder:text-neutral-light',
  logoContainer: 'w-7 mx-2.5 my-2',
  optionContainer: 'flex items-stretch py-1.5 px-3.5 cursor-pointer hover:bg-gray-100',
  searchButtonContainer: ' w-8 h-full mx-2 flex flex-col justify-center items-center',
  searchButton: 'h-7 w-7',
  focusedOption: 'bg-gray-100',
  clearButton: 'h-3 w-3 mr-3.5',
  verticalDivider: 'mr-0.5',
  recentSearchesOptionContainer: 'flex items-center h-6.5 px-3.5 py-1.5 cursor-pointer hover:bg-gray-100',
  recentSearchesIcon: 'w-5 mr-1 text-gray-400',
  recentSearchesOption: 'pl-3 text-neutral-dark',
  recentSearchesNonHighlighted: 'font-normal', // Swap this to semibold once we apply highlighting to recent searches
  verticalLink: 'ml-12 pl-1 text-neutral italic',
  entityPreviewsDivider: 'h-px bg-gray-200 mt-1 mb-4 mx-3.5',
  ...AutocompleteResultBuiltInCssClasses
};

/**
 * The CSS class interface for the {@link SearchBar}.
 *
 * @public
 */
export interface SearchBarCssClasses extends AutocompleteResultCssClasses {
  container?: string,
  inputElement?: string,
  inputContainer?: string,
  inputDropdownContainer?: string,
  inputDropdownContainer___active?: string,
  inputDivider?: string,
  clearButton?: string,
  searchButton?: string,
  searchButtonContainer?: string,
  dropdownContainer?: string,
  divider?: string,
  logoContainer?: string,
  optionContainer?: string,
  focusedOption?: string,
  recentSearchesOptionContainer?: string,
  recentSearchesIcon?: string,
  recentSearchesOption?: string,
  recentSearchesNonHighlighted?: string,
  verticalLink?: string,
  verticalDivider?: string,
  entityPreviewsDivider?: string
}

/**
 * The type of a functional React component which renders entity previews based on the autocomplete loading
 * state and the vertical results array. {@link EntityPreviews} is intended to be used here.
 *
 * @remarks
 * An onSubmit function is provided to allow an entity preview to be submitted.
 *
 * @public
 */
export type RenderEntityPreviews = (
  autocompleteLoading: boolean,
  verticalResultsArray: VerticalResultsData[],
  onSubmit: (value: string, _index: number, itemData?: FocusedItemData) => void
) => JSX.Element;

/**
 * The configuration options for Visual Autocomplete.
 *
 * @public
 */
export interface VisualAutocompleteConfig {
  /** The Answers Headless instance used to perform visual autocomplete searches. */
  entityPreviewSearcher: AnswersHeadless,
  /**
   * Renders entity previews based on the autocomplete loading state and results.
   * {@link EntityPreviews} is intended to be used here.
   **/
  renderEntityPreviews: RenderEntityPreviews,
  /** Specify which verticals to return for VisualAutocomplete. */
  restrictVerticals: string[],
  /** Specify the number of entities to return per vertical. **/
  universalLimit?: UniversalLimit,
  /** The debouncing time, in milliseconds, for making API requests for entity previews. */
  entityPreviewsDebouncingTime?: number
}

/**
 * The interface of a function which is called on a search.
 *
 * @public
 */
export type onSearchFunc = (searchEventData: { verticalKey?: string, query?: string }) => void;

/**
 * The props for the {@link SearchBar} component.
 *
 * @public
 */
export interface SearchBarProps {
  /** The search bar's placeholder text. */
  placeholder?: string,
  /** {@inheritDoc LocationBiasProps.geolocationOptions} */
  geolocationOptions?: PositionOptions,
  /** CSS classes for customizing the component styling. */
  customCssClasses?: SearchBarCssClasses,
   /** {@inheritDoc CompositionMethod} */
  cssCompositionMethod?: CompositionMethod,
  /** {@inheritDoc VisualAutocompleteConfig} */
  visualAutocompleteConfig?: VisualAutocompleteConfig,
  /** Hides vertical links if true. */
  hideVerticalLinks?: boolean,
  /** A function which is called when a vertical link is selected. */
  onSelectVerticalLink?: (data: { verticalLink: VerticalLink, querySource: QuerySource }) => void,
  /** A function which returns a display label for the given verticalKey. */
  verticalKeyToLabel?: (verticalKey: string) => string,
  /** Hides recent searches if true. */
  hideRecentSearches?: boolean,
  /** Limits the number of recent searches shown. */
  recentSearchesLimit?: number,
  /** A callback which is called when a search is ran. */
  onSearch?: onSearchFunc
}

/**
 * Renders a SearchBar that is hooked up with an InputDropdown component.
 *
 * @public
 */
export function SearchBar({
  placeholder,
  geolocationOptions,
  hideRecentSearches,
  visualAutocompleteConfig,
  hideVerticalLinks,
  onSelectVerticalLink,
  verticalKeyToLabel,
  recentSearchesLimit = 5,
  customCssClasses,
  cssCompositionMethod,
  onSearch
}: SearchBarProps): JSX.Element {
  const {
    entityPreviewSearcher,
    renderEntityPreviews,
    restrictVerticals,
    universalLimit,
    entityPreviewsDebouncingTime = 500
  } = visualAutocompleteConfig ?? {};
  const answersActions = useAnswersActions();
  const answersUtilities = useAnswersUtilities();
  const reportAnalyticsEvent = useSearchBarAnalytics();

  const query = useAnswersState(state => state.query.input) ?? '';
  const cssClasses = useComposedCssClasses(builtInCssClasses, customCssClasses, cssCompositionMethod);
  const isVertical = useAnswersState(state => state.meta.searchType) === SearchTypeEnum.Vertical;
  const [autocompleteResponse, executeAutocomplete, clearAutocompleteData] = useSynchronizedRequest(
    () => executeAutocompleteSearch(answersActions)
  );
  const [
    executeQueryWithNearMeHandling,
    autocompletePromiseRef,
  ] = useSearchWithNearMeHandling(geolocationOptions, onSearch);
  const [recentSearches, setRecentSearch, clearRecentSearches] = useRecentSearches(recentSearchesLimit);
  const filteredRecentSearches = recentSearches?.filter(search =>
    answersUtilities.isCloseMatch(search.query, query)
  );

  useEffect(() => {
    if (hideRecentSearches) {
      clearRecentSearches();
    }
  }, [clearRecentSearches, hideRecentSearches]);

  const clearAutocomplete = useCallback(() => {
    clearAutocompleteData();
    autocompletePromiseRef.current = undefined;
  }, [autocompletePromiseRef, clearAutocompleteData]);

  const executeQuery = useCallback(() => {
    if (!hideRecentSearches) {
      const input = answersActions.state.query.input;
      input && setRecentSearch(input);
    }
    executeQueryWithNearMeHandling();
  }, [answersActions.state.query.input, executeQueryWithNearMeHandling, hideRecentSearches, setRecentSearch]);

  const handleSubmit = useCallback((value?: string, index?: number, itemData?: FocusedItemData) => {
    value !== undefined && answersActions.setQuery(value);
    answersActions.setOffset(0);
    answersActions.resetFacets();
    clearStaticRangeFilters(answersActions);
    if (itemData && isVerticalLink(itemData.verticalLink) && onSelectVerticalLink) {
      onSelectVerticalLink({ verticalLink: itemData.verticalLink, querySource: QuerySource.Autocomplete });
    } else {
      executeQuery();
    }
    if (typeof index === 'number' && index >= 0 && !itemData?.isEntityPreview) {
      reportAnalyticsEvent('AUTO_COMPLETE_SELECTION', value);
    }
  }, [answersActions, executeQuery, onSelectVerticalLink, reportAnalyticsEvent]);

  const [
    entityPreviewsState,
    executeEntityPreviewsQuery
  ] = useEntityPreviews(entityPreviewSearcher, entityPreviewsDebouncingTime);
  const { verticalResultsArray, isLoading: entityPreviewsLoading } = entityPreviewsState;
  const entityPreviews = renderEntityPreviews
    && renderEntityPreviews(entityPreviewsLoading, verticalResultsArray, handleSubmit);
  const updateEntityPreviews = useCallback((query: string) => {
    if (!renderEntityPreviews || !restrictVerticals) {
      return;
    }
    executeEntityPreviewsQuery(query, universalLimit ?? {}, restrictVerticals);
  }, [executeEntityPreviewsQuery, renderEntityPreviews, restrictVerticals, universalLimit]);

  const handleInputFocus = useCallback((value = '') => {
    answersActions.setQuery(value);
    updateEntityPreviews(value);
    autocompletePromiseRef.current = executeAutocomplete();
  }, [answersActions, autocompletePromiseRef, executeAutocomplete, updateEntityPreviews]);

  const handleInputChange = useCallback((value = '') => {
    answersActions.setQuery(value);
    updateEntityPreviews(value);
    autocompletePromiseRef.current = executeAutocomplete();
  }, [answersActions, autocompletePromiseRef, executeAutocomplete, updateEntityPreviews]);

  const handleClickClearButton = useCallback(() => {
    updateEntityPreviews('');
    handleSubmit('');
    reportAnalyticsEvent('SEARCH_CLEAR_BUTTON');
  }, [handleSubmit, reportAnalyticsEvent, updateEntityPreviews]);

  function renderInput() {
    return (
      <DropdownInput
        className={cssClasses.inputElement}
        placeholder={placeholder}
        onSubmit={handleSubmit}
        onFocus={handleInputFocus}
        onChange={handleInputChange}
        ariaLabel='Conduct a search'
      />
    );
  }

  function renderRecentSearches() {
    if (isVertical) {
      return null;
    }

    const recentSearchesCssClasses = {
      icon: cssClasses.recentSearchesIcon,
      option: cssClasses.recentSearchesOption,
      nonHighlighted: cssClasses.recentSearchesNonHighlighted
    };

    return filteredRecentSearches?.map((result, i) => (
      <DropdownItem
        className={cssClasses.recentSearchesOptionContainer}
        focusedClassName={classNames(cssClasses.recentSearchesOptionContainer, cssClasses.focusedOption)}
        key={i}
        value={result.query}
        onClick={handleSubmit}
      >
        {renderAutocompleteResult(
          { value: result.query },
          recentSearchesCssClasses,
          RecentSearchIcon,
          `recent search: ${result.query}`
        )}
      </DropdownItem>
    ));
  }

  const itemDataMatrix = useMemo(() => {
    return autocompleteResponse?.results.map(result => {
      return result.verticalKeys?.map(verticalKey => ({
        verticalLink: { verticalKey, query: result.value }
      })) ?? [];
    }) ?? [];
  }, [autocompleteResponse?.results]);

  function renderQuerySuggestions() {
    return autocompleteResponse?.results.map((result, i) => (
      <Fragment key={i}>
        <DropdownItem
          className={cssClasses.optionContainer}
          focusedClassName={classNames(cssClasses.optionContainer, cssClasses.focusedOption)}
          value={result.value}
          onClick={handleSubmit}
        >
          {renderAutocompleteResult(
            result,
            cssClasses,
            MagnifyingGlassIcon,
            `autocomplete option: ${result.value}`
          )}
        </DropdownItem>
        {!hideVerticalLinks && !isVertical && result.verticalKeys?.map((verticalKey, j) => (
          <DropdownItem
            key={j}
            className={cssClasses.optionContainer}
            focusedClassName={classNames(cssClasses.optionContainer, cssClasses.focusedOption)}
            value={result.value}
            itemData={itemDataMatrix[i][j]}
            onClick={handleSubmit}
          >
            {renderAutocompleteResult(
              { value: `in ${verticalKeyToLabel ? verticalKeyToLabel(verticalKey) : verticalKey}` },
              { ...cssClasses, option: cssClasses.verticalLink }
            )}
          </DropdownItem>
        ))}
      </Fragment>
    ));
  }

  function renderClearButton() {
    return (
      <>
        <button
          aria-label='Clear the search bar'
          className={cssClasses.clearButton}
          onClick={handleClickClearButton}
        >
          <CloseIcon />
        </button>
        <VerticalDividerIcon className={cssClasses.verticalDivider} />
      </>
    );
  }

  const transformedEntityPreviews = entityPreviews
    && transformEntityPreviews(entityPreviews, verticalResultsArray);
  const entityPreviewsCount = calculateEntityPreviewsCount(transformedEntityPreviews);
  const showEntityPreviewsDivider = entityPreviewsCount > 0
    && !!(autocompleteResponse?.results.length || (!isVertical && filteredRecentSearches?.length));
  const hasItems = !!(autocompleteResponse?.results.length
    || (!isVertical && filteredRecentSearches?.length) || entityPreviewsCount);
  const screenReaderText = getScreenReaderText(
    autocompleteResponse?.results.length,
    filteredRecentSearches?.length,
    entityPreviewsCount
  );
  const activeClassName = classNames(cssClasses.inputDropdownContainer, {
    [cssClasses.inputDropdownContainer___active ?? '']: hasItems
  });

  const handleToggleDropdown = useCallback(isActive => {
    if (!isActive) {
      clearAutocomplete();
    }
  }, [clearAutocomplete]);

  return (
    <div className={cssClasses.container}>
      <Dropdown
        className={cssClasses.inputDropdownContainer}
        activeClassName={activeClassName}
        screenReaderText={screenReaderText}
        parentQuery={query}
        onToggle={handleToggleDropdown}
      >
        <div className={cssClasses.inputContainer}>
          <div className={cssClasses.logoContainer}>
            <YextIcon />
          </div>
          {renderInput()}
          {query && renderClearButton()}
          <DropdownSearchButton
            handleSubmit={handleSubmit}
            cssClasses={cssClasses}
          />
        </div>
        {hasItems &&
          <StyledDropdownMenu cssClasses={cssClasses}>
            {renderRecentSearches()}
            {renderQuerySuggestions()}
            {showEntityPreviewsDivider && <div className={cssClasses.entityPreviewsDivider}></div>}
            {transformedEntityPreviews}
          </StyledDropdownMenu>
        }
      </Dropdown>
    </div>
  );
}

function StyledDropdownMenu({ cssClasses, children }: PropsWithChildren<{
  cssClasses: {
    inputDivider?: string,
    dropdownContainer?: string
  }
}>) {
  return (
    <DropdownMenu>
      <div className={cssClasses.inputDivider} />
      <div className={cssClasses.dropdownContainer}>
        {children}
      </div>
    </DropdownMenu>
  );
}

function getScreenReaderText(
  autocompleteOptions = 0,
  recentSearchesOptions = 0,
  entityPreviewsCount = 0
): string {
  const recentSearchesText = recentSearchesOptions > 0
    ? processTranslation({
      phrase: `${recentSearchesOptions} recent search found.`,
      pluralForm: `${recentSearchesOptions} recent searches found.`,
      count: recentSearchesOptions
    })
    : '';
  const entityPreviewsText = entityPreviewsCount > 0
    ? ' ' + processTranslation({
      phrase: `${entityPreviewsCount} result preview found.`,
      pluralForm: `${entityPreviewsCount} result previews found.`,
      count: entityPreviewsCount
    })
    : '';
  const autocompleteText = autocompleteOptions > 0
    ? ' ' + processTranslation({
      phrase: `${autocompleteOptions} autocomplete suggestion found.`,
      pluralForm: `${autocompleteOptions} autocomplete suggestions found.`,
      count: autocompleteOptions
    })
    : '';

  const text = recentSearchesText + autocompleteText + entityPreviewsText;
  if (text === '') {
    return processTranslation({
      phrase: '0 autocomplete suggestion found.',
      pluralForm: '0 autocomplete suggestions found.',
      count: 0
    });
  }
  return text.trim();
}

function DropdownSearchButton({ handleSubmit, cssClasses }: {
  handleSubmit: () => void,
  cssClasses: {
    searchButtonContainer?: string,
    searchButton?: string
  }
}) {
  const { toggleDropdown } = useDropdownContext();
  const handleClick = useCallback(() => {
    handleSubmit();
    toggleDropdown(false);
  }, [handleSubmit, toggleDropdown]);
  return (
    <div className={cssClasses.searchButtonContainer}>
      <SearchButton
        className={cssClasses.searchButton}
        handleClick={handleClick}
      />
    </div>
  );
}