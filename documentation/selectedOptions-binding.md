---
layout: documentation
title: The "selectedOptions" binding
---

### Purpose
The `selectedOptions` binding controls which elements in a multi-select list are currently selected. This is intended to be used in conjunction with a `<select>` element and the `options` binding.

When the user selects or de-selects an item in the multi-select list, this adds or removes the corresponding value to an array on your view model. 
Likewise, assuming it's an *observable* array on your view model, then whenever you add or remove (e.g., via `push` or `splice`) items to this array, the corresponding items in the UI become selected or deselected. It's a 2-way binding.

Note: To control which element in a single-select drop-down list is selected, you can use [the `value` binding](value-binding.html) instead.

### Example
    <p>
        Choose some countries you'd like to visit: 
        <select data-bind="options: availableCountries, selectedOptions: chosenCountries" size="5" multiple="true"></select>
    </p>
    
    <script type="text/javascript">
        var viewModel = {
            availableCountries : ko.observableArray(['France', 'Germany', 'Spain']),
            chosenCountries : ko.observableArray(['Germany']) // Initially, only Germany is selected
        };
        
        // ... then later ...
        viewModel.chosenCountries.push('France'); // Now France is selected too
    </script>
    
### Parameters

 * Main parameter
   
   This should be an array (or an observable array). KO sets the element's selected options to match the contents of the array. Any previous selection state will be overwritten.
   
   If your parameter is an observable array, the binding will update the element's selection whenever the array changes (e.g., via `push`, `pop` or [other observable array methods](observableArrays.html)). If the parameter isn't observable, it will only set the element's selection state once and will not update it again later.
   
   Whether or not the parameter is an observable array, KO will detect when the user selects or deselects an item in the multi-select list, and will update the array to match. This is how you can read which of the options is selected.
      
 * Additional parameters 

   None
   
### Note: Letting the user select from arbitrary JavaScript objects

In the example code above, the user can choose from an array of string values. You're *not* limited to providing strings - your `options` array can contain arbitrary JavaScript objects if you wish. See [the `options` binding](options-binding.html) for details on how to control how arbitrary objects should be displayed in the list.

In this scenario, the values you can read and write using `selectedOptions` are those objects themselves, *not* their textual representations. This leads to much cleaner and more elegant code in most cases. Your view model can imagine that the user chooses from an array of arbitrary objects, without having to care how those objects are mapped to an on-screen representation.
     
### Dependencies

None, other than the core Knockout library.