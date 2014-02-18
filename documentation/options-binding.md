---
layout: documentation
title: The "options" binding
---

### Purpose
The `options` binding controls what options should appear in a drop-down list (i.e., a `<select>` element) or multi-select list (e.g., `<select size='6'>`). This binding cannot be used with anything other than `<select>` elements.

The value you assign should be an array (or observable array). The `<select>` element will then display one item for each item in your array.

Note: For a multi-select list, to set which of the options are selected, or to read which of the options are selected, use [the `selectedOptions` binding](selectedOptions-binding.html). For a single-select list, you can also read and write the selected option using [the `value` binding](value-binding.html).

### Example 1: Drop-down list
    <p>
        Destination country:
        <select data-bind="options: availableCountries"></select>
    </p>

    <script type="text/javascript">
        var viewModel = {
            // These are the initial options
            availableCountries: ko.observableArray(['France', 'Germany', 'Spain'])
        };

        // ... then later ...
        viewModel.availableCountries.push('China'); // Adds another option
    </script>

### Example 2: Multi-select list
    <p>
        Choose some countries you would like to visit:
        <select data-bind="options: availableCountries" size="5" multiple="true"></select>
    </p>

    <script type="text/javascript">
        var viewModel = {
            availableCountries: ko.observableArray(['France', 'Germany', 'Spain'])
        };
    </script>

### Example 3: Drop-down list representing arbitrary JavaScript objects, not just strings
    <p>
        Your country:
        <select data-bind="options: availableCountries,
                           optionsText: 'countryName',
                           value: selectedCountry,
                           optionsCaption: 'Choose...'"></select>
    </p>

    <div data-bind="visible: selectedCountry"> <!-- Appears when you select something -->
        You have chosen a country with population
        <span data-bind="text: selectedCountry() ? selectedCountry().countryPopulation : 'unknown'"></span>.
    </div>

    <script type="text/javascript">
        // Constructor for an object with two properties
        var Country = function(name, population) {
            this.countryName = name;
            this.countryPopulation = population;
        };

        var viewModel = {
            availableCountries : ko.observableArray([
                new Country("UK", 65000000),
                new Country("USA", 320000000),
                new Country("Sweden", 29000000)
            ]),
            selectedCountry : ko.observable() // Nothing selected by default
        };
    </script>

### Example 4: Drop-down list representing arbitrary JavaScript objects, with displayed text computed as a function of the represented item

    <!-- Same as example 3, except the <select> box expressed as follows: -->
    <select data-bind="options: availableCountries,
                       optionsText: function(item) {
                           return item.countryName + ' (pop: ' + item.countryPopulation + ')'
                       },
                       value: selectedCountry,
                       optionsCaption: 'Choose...'"></select>

Note that the only difference between examples 3 and 4 is the `optionsText` value.

### Parameters

 * Main parameter

   You should supply an array (or observable array). For each item, KO will add an `<option>` to the associated `<select>` node. Any previous options will be removed.

   If your parameter's value is an array of strings, you don't need to give any other parameters. The `<select>` element will display an option for each string value. However, if you want to let the user choose from an array of *arbitrary JavaScript objects* (not merely strings), then see the `optionsText` and `optionsValue` parameters below.

   If this parameter is an observable value, the binding will update the element's available options whenever the value changes. If the parameter isn't observable, it will only set the element's available options once and will not update them again later.

 * Additional parameters

   * `optionsCaption`

     Sometimes, you might not want to select any particular option by default. But a single-select drop-down list usually starts with some item selected, so how can you avoid preselecting something? The usual solution is to prefix the list of options with a special dummy option that just reads "Select an item" or "Please choose an option" or similar, and have that one selected by default.

     This easy to do: just add an additional parameter with name `optionsCaption`, with its value being a string to display. For example:

     `<select data-bind='options: myOptions, optionsCaption: "Select an item...", value: myChosenValue'></select>`

     KO will prefix the list of items with one that displays the text "Select an item..." and has the value `undefined`. So, if `myChosenValue` holds the value `undefined` (which observables do by default), then the dummy option will be selected. If the `optionsCaption` parameter is an observable, then the text of the initial item will update as the observable's value changes.

   * `optionsText`

     See Example 3 above to see how you can bind `options` to an array of arbitrary JavaScript object - not just strings. In this case, you need to choose which of the objects' properties should be displayed as the text in the drop-down list or multi-select list. Example 3 shows how you can specify that property name by passing an additional parameter called `optionsText`.

     If you don't want to display just a simple property value as the text for each item in the dropdown, you can pass a JavaScript function for the `optionsText` option and supply your own arbitrary logic for computing the displayed text in terms of the represented object. See Example 4 above, which shows how you could generate the displayed text by concatenating together multiple property values.

   * `optionsValue`

     Similar to `optionsText`, you can also pass an additional parameter called `optionsValue` to specify which of the objects' properties should be used to set the `value` attribute on the `<option>` elements that KO generates. You can also specify a JavaScript function to determine this value. This function will receive the selected item as its only argument and should return a string to use for the `<option>` element's value attribute.

     Typically you'd only want to use `optionsValue` as a way of ensuring that KO can correctly retain selection when you update the set of available options. For example, if you're repeatedly getting a list of "car" objects via Ajax calls and want to ensure that the selected car is preserved, you might need to set `optionsValue` to `"carId"` or whatever unique identifier each "car" object has, otherwise KO won't necessarily know which of the previous "car" objects corresponds to which of the new ones.

   * `optionsIncludeDestroyed`

     Sometimes you may want to mark an array entry as deleted, but without actually losing record of its existence. This is known as a non-destructive delete. For details of how to do this, see [the destroy function on `observableArray`](observableArrays.html#destroy_and_destroyall_note_usually_relevant_to_ruby_on_rails_developers_only).

     By default, the options binding will skip over (i.e., hide) any array entries that are marked as destroyed. If you want to show destroyed entries, then specify this additional parameter like:

     `<select data-bind='options: myOptions, optionsIncludeDestroyed: true'></select>`

   * `optionsAfterRender`

     If you need to run some further custom logic on the generated `option` elements, you can use the `optionsAfterRender` callback. See Note 2 below.

   * `selectedOptions`

     For a multi-select list, you can read and write the selection state using `selectedOptions`. Technically this is a separate binding, so it has [its own documentation](selectedOptions-binding.html).

   * `valueAllowUnset`

     If you want Knockout to allow your model property to take values that have no corresponding entry in your `<select>` element (and display this by making the `<select>` element blank), then see [documentation for `valueAllowUnset`](value-binding.html#using-valueallowunset-with-select-elements).

### Note 1: Selection is preserved when setting/changing options

When the `options` binding changes the set of options in your `<select>` element, KO will leave the user's selection unchanged where possible. So, for a single-select drop-down list, the previously selected option value will still be selected, and for a multi-select list, all the previously selected option values will still be selected (unless, of course, you've removed one or more of those options).

That's because the `options` binding tries to be independent of the `value` binding (which controls selection for a single-select list) and the `selectedOptions` binding (which controls selection for a multi-select list).

### Note 2: Post-processing the generated options

If you need to run some further custom logic on the generated `option` elements, you can use the `optionsAfterRender` callback. The callback function is invoked each time an `option` element is inserted into the list, with the following parameters:

1. The inserted `option` element
2. The data item against which it is bound, or `undefined` for the caption element

Here's an example that uses `optionsAfterRender` to add a `disable` binding to each option.

    <select size=3 data-bind="
        options: myItems,
        optionsText: 'name',
        optionsValue: 'id',
        optionsAfterRender: setOptionDisable">
    </select>

    <script type="text/javascript">
        var vm = {
            myItems: [
                { name: 'Item 1', id: 1, disable: ko.observable(false)},
                { name: 'Item 3', id: 3, disable: ko.observable(true)},
                { name: 'Item 4', id: 4, disable: ko.observable(false)}
            ],
            setOptionDisable: function(option, item) {
                ko.applyBindingsToNode(option, {disable: item.disable}, item);
            }
        };
        ko.applyBindings(vm);
    </script>

### Dependencies

None, other than the core Knockout library.