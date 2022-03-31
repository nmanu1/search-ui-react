import { Filter, Matcher,NumberRangeValue, useAnswersActions, useAnswersState, LowerNumberRangeLimit, UpperNumberRangeLimit } from '@yext/answers-headless-react';
import { useCallback, useMemo, useState } from 'react';
import { useFilterGroupContext } from './FilterGroupContext';
import { CompositionMethod, useComposedCssClasses } from '../../hooks/useComposedCssClasses';
import { findSelectableFilter, isNearFilterValue } from '../../utils/filterutils';
import { executeSearch } from '../../utils/search-operations';
import classNames from 'classnames';

/**
 * Props for the {@link Filters.RangeInput}
 *
 * @public
 */
export interface RangeInputProps {
  /**
   * Returns the filter's display name based on the range values which is used when the filter
   * is displayed by other components such as AppliedFilters.
   *
   * @remarks
   * By default, the displayName separates the range with a dash such as '10 - 20'.
   * If the range is unbounded, it will display as 'Up to 20' or 'Over 10'.
   */
  getFilterDisplayName?: (value: NumberRangeValue) => string,
  /**
   * An optional element which renders in front of the input text.
   */
  inputPrefix?: JSX.Element,
  /** CSS classes for customizing the component styling defined by {@link Filters.RangeInputCssClasses} */
  customCssClasses?: RangeInputCssClasses,
  /** {@inheritDoc CompositionMethod} */
  cssCompositionMethod?: CompositionMethod
}

/**
 * The CSS class interface for {@link Filters.RangeInput}.
 *
 * @public
 */
export interface RangeInputCssClasses {
  container?: string,
  input?: string,
  input___withPrefix?: string,
  input___withoutPrefix?: string,
  inputContainer?: string,
  inputRowContainer?: string,
  buttonsContainer?: string,
  label?: string,
  inputPrefix?: string,
  divider?: string,
  applyButton?: string,
  clearButton?: string
}

const builtInCssClasses: RangeInputCssClasses = {
  container: 'flex flex-col',
  input: 'w-24 h-9 form-input cursor-pointer border border-gray-300 rounded-md text-neutral-dark text-sm focus:ring-primary focus:ring-0 appearance-none leading-9 placeholder:text-neutral',
  input___withPrefix: 'pl-[1.375rem]',
  input___withoutPrefix: 'px-2',
  inputContainer: 'relative',
  inputRowContainer: 'flex flex-row items-center space-x-3',
  buttonsContainer: 'flex flex-row items-center justify-between pt-2',
  label: 'text-neutral text-sm font-normal cursor-pointer',
  inputPrefix: 'absolute left-2 top-2 text-sm text-neutral',
  divider: 'w-2.5 text-sm text-neutral',
  applyButton: 'text-sm text-primary font-medium',
  clearButton: 'text-sm text-neutral font-medium'
};

/**
 * Represents a single number range static filter which accepts user input.
 *
 * @public
 *
 * @param props - {@link Filters.RangeInputProps}
 */
export function RangeInput(props: RangeInputProps): JSX.Element | null {
  const { defaultFieldId: fieldId } = useFilterGroupContext();
  const {
    getFilterDisplayName = getDefaultFilterDisplayName,
    inputPrefix
  } = props;
  const cssClasses = useComposedCssClasses(
    builtInCssClasses, props.customCssClasses, props.cssCompositionMethod);
  const answersActions = useAnswersActions();
  const [minRangeInput, setMinRangeInput] = useState<string>('');
  const [maxRangeInput, setMaxRangeInput] = useState<string>('');
  const staticFilters = useAnswersState(state => state.filters.static);

  const value: NumberRangeValue = useMemo(() => {
    const minRange = parseNumber(minRangeInput);
    const maxRange = parseNumber(maxRangeInput);

    return {
      ...(minRange !== undefined && {
        start: {
          matcher: Matcher.GreaterThanOrEqualTo,
          value: minRange
        }
      }),
      ...(maxRange !== undefined && {
        end: {
          matcher: Matcher.LessThanOrEqualTo,
          value: maxRange
        }
      })
    };
  }, [maxRangeInput, minRangeInput]);

  const displayName = getFilterDisplayName(value);

  const rangeFilter: Filter = useMemo(() => {
    return {
      fieldId: fieldId ?? '',
      matcher: Matcher.Between,
      value
    };
  }, [fieldId, value]);

  // Find a static filter which matches the current range input
  const matchingFilter = findSelectableFilter(rangeFilter, staticFilters ?? []);
  const isSelectedInAnswersState = matchingFilter?.selected === true;

  const isValidNumberInput = useCallback(number => {
    const numberRegex = new RegExp(/^\d*\.?\d*$/);
    return numberRegex.test(number);
  }, []);

  const handleMinChange = useCallback(event => {
    const value = event?.target?.value;
    isValidNumberInput(value) && setMinRangeInput(value);
  }, [isValidNumberInput]);

  const handleMaxChange = useCallback(event => {
    const value = event?.target?.value;
    isValidNumberInput(value) && setMaxRangeInput(value);
  }, [isValidNumberInput]);

  const handleClickApply = useCallback(() => {
    // Find a selected static range filters with the same fieldId
    const selectedRangeFilters = staticFilters?.filter(filter =>
      filter.fieldId === fieldId && filter.selected === true && filter.matcher === Matcher.Between
    );
    selectedRangeFilters?.forEach(filter => {
      answersActions.setFilterOption({
        ...filter,
        selected: false
      });
    });
    answersActions.setFilterOption({
      ...rangeFilter,
      selected: true,
      displayName
    });
    answersActions.setOffset(0);
    executeSearch(answersActions);
  }, [answersActions, displayName, fieldId, rangeFilter, staticFilters]);

  const handleClickClear = useCallback(() => {
    setMinRangeInput('');
    setMaxRangeInput('');
  }, []);

  const shouldRenderOption: boolean = useMemo(() => {
    if (!fieldId) {
      console.error('No fieldId found for filter with value', JSON.stringify(value));
      return false;
    }

    return true;
  }, [fieldId, value]);

  if (!shouldRenderOption) {
    return null;
  }

  const hasUserInput = minRangeInput || maxRangeInput;
  const renderApplyButton = hasUserInput && !isSelectedInAnswersState;

  const inputClasses = classNames(cssClasses.input, {
    [cssClasses.input___withPrefix ?? '']: !!inputPrefix,
    [cssClasses.input___withoutPrefix ?? '']: !inputPrefix
  });

  return (
    <div className={cssClasses.container}>
      <div className={cssClasses.inputRowContainer}>
        <div className={cssClasses.inputContainer}>
          {inputPrefix && <span className={cssClasses.inputPrefix} aria-hidden="true">{inputPrefix}</span>}
          <input
            type='text'
            inputMode='decimal'
            value={minRangeInput ?? ''}
            placeholder='Min'
            className={inputClasses}
            onChange={handleMinChange}
          />
        </div>
        <div className={cssClasses.divider}>-</div>
        <div className={cssClasses.inputContainer}>
          {inputPrefix && <span className={cssClasses.inputPrefix} aria-hidden="true">{inputPrefix}</span>}
          <input
            type='text'
            inputMode='decimal'
            value={maxRangeInput ?? ''}
            placeholder='Max'
            className={inputClasses}
            onChange={handleMaxChange}
          />
        </div>
      </div>
      {hasUserInput &&
        <div className={cssClasses.buttonsContainer}>
          {hasUserInput &&
            <button
              className={cssClasses.clearButton}
              onClick={handleClickClear}>Clear min and max
            </button>
          }
          {renderApplyButton &&
            <button
              className={cssClasses.applyButton}
              onClick={handleClickApply}>Apply
            </button>
          }
        </div>
      }
    </div>
  );
}

/**
 * Creates the filter's display name based on the number range.
 */
function getDefaultFilterDisplayName(numberRange: NumberRangeValue) {
  const start = numberRange.start;
  const end = numberRange.end;

  if (start && end) {
    return `${start.value} - ${end.value}`;
  } else if (start && !end) {
    return `Over ${start.value}`;
  } else if (end && !start) {
    return `Up to ${end.value}`;
  }
  return '';
}

/**
 * Given a string, returns the corresponding number, or undefined if it is NaN.
 */
function parseNumber(num?: string) {
  const parsedNum = parseFloat(num ?? '');
  if (isNaN(parsedNum)) {
    return undefined;
  }
  return parsedNum;
}
