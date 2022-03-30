import { Filter, Matcher, NumberRangeValue, useAnswersUtilities } from '@yext/answers-headless-react';
import { useCallback, useEffect, useMemo } from 'react';
import { v4 as uuid } from 'uuid';
import { useFiltersContext } from './FiltersContext';
import { useFilterGroupContext } from './FilterGroupContext';
import { CompositionMethod, useComposedCssClasses } from '../../hooks/useComposedCssClasses';
import { findSelectableFilter } from '../../utils/filterutils';

/**
 * Props for the {@link Filters.CheckboxOption}
 *
 * @public
 */
export interface CheckboxOptionProps {
  /** The value used to perform filtering. */
  value: string | number | boolean | NumberRangeValue,
  /**
   * The fieldId used for filtering.
   *
   * @remarks
   * When fieldId is unspecified, it defaults to the defaultFieldId of the nearest
   * {@link Filters.FilterGroup}. If there is no fieldId or defaultFieldId, the component does not render and
   * an error is logged.
   */
  fieldId?: string,
  /** If this particular filter should be selected by default. */
  selectedByDefault?: boolean,
  /** The display label. Defaults to the value prop. */
  label?: string,
  /** CSS classes for customizing the component styling defined by {@link Filters.CheckboxCssClasses} */
  customCssClasses?: CheckboxCssClasses,
  /** {@inheritDoc CompositionMethod} */
  cssCompositionMethod?: CompositionMethod
}

/**
 * The CSS class interface for {@link Filters.CheckboxOption}.
 *
 * @public
 */
export interface CheckboxCssClasses {
  input?: string,
  label?: string,
  container?: string
}

const builtInCssClasses: CheckboxCssClasses = {
  label: 'text-neutral text-sm font-normal cursor-pointer',
  input: 'w-3.5 h-3.5 form-checkbox cursor-pointer border border-gray-300 rounded-sm text-primary focus:ring-primary',
  container: 'flex items-center space-x-3'
};

/**
 * A checkbox component that represents a single Filter.
 *
 * @public
 *
 * @param props - {@link Filters.CheckboxOptionProps}
 */
export function CheckboxOption(props: CheckboxOptionProps): JSX.Element | null {
  const { searchValue, defaultFieldId } = useFilterGroupContext();
  const {
    fieldId = defaultFieldId,
    value,
    selectedByDefault = false,
    label = props.value,
  } = props;
  const cssClasses = useComposedCssClasses(
    builtInCssClasses, props.customCssClasses, props.cssCompositionMethod);
  const optionId = useMemo(() => uuid(), []);
  const answersUtilities = useAnswersUtilities();
  const { selectFilter, filters, applyFilters } = useFiltersContext();

  const handleClick = useCallback((checked: boolean) => {
    selectFilter({
      matcher: Matcher.Equals,
      fieldId: fieldId ?? '',
      value,
      displayName: typeof label === 'string' ? label : undefined,
      selected: checked
    });
    applyFilters();
  }, [applyFilters, fieldId, label, selectFilter, value]);

  const handleChange = useCallback(evt => {
    handleClick(evt.target.checked);
  }, [handleClick]);

  const optionFilter: Filter = useMemo(() => {
    return {
      fieldId: fieldId ?? '',
      matcher: Matcher.Equals,
      value
    };
  }, [fieldId, value]);
  const existingStoredFilter = findSelectableFilter(optionFilter, filters);

  const shouldRenderOption: boolean = useMemo(() => {
    if (!fieldId) {
      console.error('No fieldId found for filter with value', value);
      return false;
    }

    if (typeof label !== 'string') {
      console.error('A label is needed for filter with value', value);
      return false;
    }

    if (!answersUtilities.isCloseMatch(label.toString(), searchValue)) {
      return false;
    }

    return true;
  }, [fieldId, value, answersUtilities, label, searchValue]);

  useEffect(() => {
    if (shouldRenderOption) {
      if (!existingStoredFilter && selectedByDefault) {
        selectFilter({
          matcher: Matcher.Equals,
          fieldId: optionFilter.fieldId,
          value: optionFilter.value,
          displayName: typeof label === 'string' ? label : undefined,
          selected: true
        });
      }
    }
  }, [label, selectFilter, selectedByDefault, existingStoredFilter, optionFilter, shouldRenderOption]);

  if (!shouldRenderOption) {
    return null;
  }

  const isSelected = existingStoredFilter ? existingStoredFilter.selected : false;

  return (
    <div className={cssClasses.container}>
      <input
        type='checkbox'
        id={optionId}
        checked={isSelected}
        className={cssClasses.input}
        onChange={handleChange}
      />
      <label className={cssClasses.label} htmlFor={optionId}>{label}</label>
    </div>
  );
}
