---
layout: documentation
title: The "checked" binding
---

### Purpose
The `checked` binding links a checkable form control &mdash; i.e., a checkbox (`<input type='checkbox'>`) or a radio button (`<input type='radio'>`) &mdash; with a property on your view model.

When the user checks the associated form control, this updates the value on your view model. Likewise, when you update the value in your view model, this checks or unchecks the form control on screen.

Note: For text boxes, drop-down lists, and all non-checkable form controls, use [the `value` binding](value-binding.html) to read and write the element's value, not the `checked` binding.

### Example with checkbox
    <p>Send me spam: <input type="checkbox" data-bind="checked: wantsSpam" /></p>
    
    <script type="text/javascript">
	    var viewModel = {
			wantsSpam: ko.observable(true) // Initially checked
	    };
	    
	    // ... then later ...
	    viewModel.wantsSpam(false); // The checkbox becomes unchecked
    </script>

### Example adding checkboxes bound to an array
    <p>Send me spam: <input type="checkbox" data-bind="checked: wantsSpam" /></p>
    <div data-bind="visible: wantsSpam">
    	Preferred flavors of spam:
    	<div><input type="checkbox" value="cherry" data-bind="checked: spamFlavors" /> Cherry</div>
    	<div><input type="checkbox" value="almond" data-bind="checked: spamFlavors" /> Almond</div>
    	<div><input type="checkbox" value="msg" data-bind="checked: spamFlavors" /> Monosodium Glutamate</div>
    </div>
    
    <script type="text/javascript">
	    var viewModel = {
			wantsSpam: ko.observable(true),
			spamFlavors: ko.observableArray(["cherry","almond"]) // Initially checks the Cherry and Almond checkboxes
	    };
	    
	    // ... then later ...
	    viewModel.spamFlavors.push("msg"); // Now additionally checks the Monosodium Glutamate checkbox
    </script>
    
### Example adding radio buttons
    <p>Send me spam: <input type="checkbox" data-bind="checked: wantsSpam" /></p>
    <div data-bind="visible: wantsSpam">
    	Preferred flavor of spam:
    	<div><input type="radio" name="flavorGroup" value="cherry" data-bind="checked: spamFlavor" /> Cherry</div>
    	<div><input type="radio" name="flavorGroup" value="almond" data-bind="checked: spamFlavor" /> Almond</div>
    	<div><input type="radio" name="flavorGroup" value="msg" data-bind="checked: spamFlavor" /> Monosodium Glutamate</div>
    </div>
    
    <script type="text/javascript">
	    var viewModel = {
			wantsSpam: ko.observable(true),
			spamFlavor: ko.observable("almond") // Initially selects only the Almond radio button
	    };
	    
	    // ... then later ...
	    viewModel.spamFlavor("msg"); // Now only Monosodium Glutamate is checked
    </script>

### Parameters

 * Main parameter
   
   KO sets the element's checked state to match your parameter value. Any previous checked state will be overwritten. The way your parameter is interpreted depends on what type of element you're binding to:
   
   * For **checkboxes**, KO will set the element to be *checked* when the parameter value is `true`, and *unchecked* when it is `false`. If you give a value that isn't actually boolean, it will be interpreted loosely. This means that nonzero numbers and non-`null` objects and non-empty strings will all be interpreted as `true`, whereas zero, `null`, `undefined`, and empty strings will be interpreted as `false`.
   
     When the user checks or unchecks the checkbox, KO will set your model property to `true` or `false` accordingly.
     
     Special consideration is given if your parameter resolves to an `array`. In this case, KO will set the element to be *checked* if the value matches an item in the array, and *unchecked* if it is not contained in the array. 
     
     When the user checks or unchecks the checkbox, KO will add or remove the value from the array accordingly.
   
   * For **radio buttons**, KO will set the element to be *checked* if and only if the parameter value equals the radio button node's `value` attribute or the value specified by the `checkedValue` parameter. In the previous example, the radio button with `value="almond"` was checked only when the view model's `spamFlavor` property was equal to `"almond"`.
   
     When the user changes which radio button is selected, KO will set your model property to equal the value of the selected radio button. In the preceding example, clicking on the radio button with `value="cherry"` would set `viewModel.spamFlavor` to be `"cherry"`.
     
     Of course, this is most useful when you have multiple radio button elements bound to a single model property. To ensure that only *one* of those radio buttons can be checked at any one time, you should set all of their `name` attributes to an arbitrary common value (e.g., the value `flavorGroup` in the preceding example) - doing this puts them into a group where only one can be selected.
   
   If your parameter is an observable value, the binding will update the element's checked state whenever the value changes. If the parameter isn't observable, it will only set the element's checked state once and will not update it again later.   

 * Additional parameters 

   * `checkedValue`

     If your binding also includes `checkedValue`, this defines the value used by the `checked` binding instead of the element's `value` attribute. This is useful if you want the value to be something other than a string (such as an integer or object), or you want the value set dynamically.

     In the following example, the item objects themselves (not their `itemName` strings) will be included in the `chosenItems` array when their corresponding checkboxes are checked:

            <!-- ko foreach: items -->
                <input type="checkbox" data-bind="checkedValue: $data, checked: $root.chosenItems" />
                <span data-bind="text: itemName"></span>
            <!-- /ko -->

            <script type="text/javascript">
                var viewModel = {
                    items: ko.observableArray([
                        { itemName: 'Choice 1' },
                        { itemName: 'Choice 2' }
                    ]),
                    chosenItems: ko.observableArray()
                };
            </script>

     If your `checkedValue` parameter is an observable value, whenever the value changes and the element is currently checked, the binding will update the `checked` model property. For checkboxes, it will remove the old value from the array and add the new value. For radio buttons, it will just update the model value.

### Dependencies

None, other than the core Knockout library.
