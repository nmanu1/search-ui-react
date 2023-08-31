<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@yext/search-ui-react](./search-ui-react.md) &gt; [NumericalFacetProps](./search-ui-react.numericalfacetprops.md)

## NumericalFacetProps interface

Props for the [StandardFacet()](./search-ui-react.standardfacet.md) component.

<b>Signature:</b>

```typescript
export interface NumericalFacetProps extends StandardFacetProps 
```
<b>Extends:</b> [StandardFacetProps](./search-ui-react.standardfacetprops.md)

## Properties

|  Property | Type | Description |
|  --- | --- | --- |
|  [customCssClasses?](./search-ui-react.numericalfacetprops.customcssclasses.md) | [FilterGroupCssClasses](./search-ui-react.filtergroupcssclasses.md) &amp; [RangeInputCssClasses](./search-ui-react.rangeinputcssclasses.md) | <i>(Optional)</i> CSS classes for customizing the component styling. |
|  [getFilterDisplayName?](./search-ui-react.numericalfacetprops.getfilterdisplayname.md) | (value: NumberRangeValue) =&gt; string | <i>(Optional)</i> Returns the filter's display name based on the range values which is used when the filter is displayed by other components such as AppliedFilters. |
|  [inputPrefix?](./search-ui-react.numericalfacetprops.inputprefix.md) | JSX.Element | <i>(Optional)</i> An optional element which renders in front of the input text. |
|  [showOptionCounts?](./search-ui-react.numericalfacetprops.showoptioncounts.md) | boolean | <i>(Optional)</i> Whether or not to show the option counts for each filter. Defaults to false. |
