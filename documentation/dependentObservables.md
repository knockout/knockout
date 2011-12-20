---
layout: documentation
title: Computed Observables
---

What if you've got an [observable](observables.html) for `firstName`, and another for `lastName`, and you want to display the full name? That's where *computed observables* come in - these are functions that are dependent on one or more other observables, and will automatically update whenever any of these dependencies change.

For example, given the following view model,

    var viewModel = {
    	firstName: ko.observable('Bob'),
    	lastName: ko.observable('Smith')
    };
    
... you could add a computed observable to return the full name:

    viewModel.fullName = ko.computed(function() {
    	return this.firstName() + " " + this.lastName();
    }, viewModel);
    
Now you could bind UI elements to it, e.g.:

    The name is <span data-bind="text: fullName"></span>
    
... and they will be updated whenever `firstName` or `lastName` changes (your evaluator function will be called once each time any of its dependencies change, and whatever value you return will be passed on to the observers such as UI elements or other dependent observables).

### Managing 'this'

*Beginners may wish to skip this section - as long as you follow the same coding patterns as the examples, you won't need to know or care about it!*

In case you're wondering what the second parameter to `ko.computed` is (the bit where I passed `viewModel` in the preceding code), that defines the value of `this` when evaluating the computed observable. Without that, it would not have been possible to refer to `this.firstName()` or `this.lastName()`. Experienced JavaScript coders will regard this as obvious, but if you're unfamiliar with JavaScript it might seem strange. (Languages like C# and Java never expect the programmer to set a value for `this`, but JavaScript does, because its functions themselves aren't part of any object by default.)

Unfortunately, JavaScript object literals don't have any way of referring to themselves, so you must add computed observables to view model objects by writing `myViewModelObject.myComputedProperty = ...`, and you can't just declare them inline. In other words, you *can't* write this:

    var viewModel = {
    	myComputedProperty: ko.computed(function() {
    	    ...
    	}, /* can't refer to viewModel from here, so this doesn't work */)
    }

... but instead must write this:

    var viewModel = {
    	// Add other properties here as you wish
    };
    viewModel.myComputedProperty = ko.computed(function() {
    	...
    }, viewModel); // This is OK
    
It's really not a problem as long as you know what to expect :)

### Dependency chains just work

Of course, you can create whole chains of dependent observables if you wish. For example, you might have:

* an **observable** called `items` representing a set of items
* another **observable** called `selectedIndexes` storing which item indexes have been 'selected' by the user
* a **computed observable** called `selectedItems` that returns an array of item objects corresponding to the selected indexes
* another **dependent observable** that returns `true` or `false` depending on whether any of `selectedItems` has some property (like being new or being unsaved). Some UI element, like a button, might be enabled or disabled based on this value.

Then, changes to `items` or `selectedIndexes` will ripple through the chain of computed observables, which in turn updates any UI bound to them. Very tidy and elegant.

# Writeable computed observables

*Beginners may wish to skip this section - writeable computed observables are fairly advanced and are not necessary in most situations*

As you've learned, computed observables have a value that is computed from other observables. In that sense, computed observables are normally *read-only*. What may seem surprising, then, is that it is possible to make computed observables *writeable*. You just need to supply your own callback function that does something sensible with written values.

You can then use your writeable computed observable exactly like a regular observable - performing two-way data binding with DOM elements, with your own custom logic intercepting all reads and writes. This is a powerful feature with a wide range of possible uses.

### Example 1: Decomposing user input

Going back to the classic "first name + last name = full name" example, you can turn things back-to-front: make the `fullName` computed observable writeable, so that the user can directly edit the full name, and their supplied value will be parsed and mapped back to the underlying `firstName` and `lastName` observables:

	var viewModel = { 
	    firstName : ko.observable("Planet"),
	    lastName : ko.observable("Earth")
	};
	viewModel.fullName = ko.computed({
	    read: function () {
	        return this.firstName() + " " + this.lastName(); 
	    },
	    write: function (value) {
	        var lastSpacePos = value.lastIndexOf(" ");
	        if (lastSpacePos > 0) { // Ignore values with no space character
	            this.firstName(value.substring(0, lastSpacePos)); // Update "firstName"
	            this.lastName(value.substring(lastSpacePos + 1)); // Update "lastName"
	        }
	    },
	    owner: viewModel
	});

In this example, the `write` callback handles incoming values by splitting the incoming text into "firstName" and "lastName" components, and writing those values back to the underlying observables. You can bind this view model to your DOM in the obvious way, as follows:

	<p>First name: <span data-bind="text: firstName"></span></p>
	<p>Last name: <span data-bind="text: lastName"></span></p>
	<h2>Hello, <input data-bind="value: fullName"/>!</h2>

This is the exact opposite of the [Hello World](../examples/helloWorld.html) example, in that here the first and last names are not editable, but the combined full name is editable.

The preceding view model code demonstrates the *single parameter syntax* for initialising computed observables. You can pass a JavaScript object with any of the following properties:

 * `read` --- Required. A function that is used to evaluate the computed observable's current value.
 * `write` --- Optional. If given, makes the computed observable writeable. This is a function that receives values that other code is trying to write to your computed observable. It's up to you to supply custom logic to handle the incoming values, typically by writing the values to some underlying observable(s).
 * `owner` --- Optional. If given, defines the value of `this` whenever KO invokes your `read` or `write` callbacks. See the section "Managing `this`" earlier on this page for more information.
 
### Example 2: A value converter

Sometimes you might want to represent a data point on the screen in a different format from its underlying storage. For example, you might want to store a price as a raw float value, but let the user edit it with a currency symbol and fixed number of decimal places. You can use a writeable computed observable to represent the formatted price, mapping incoming values back to the underlying float value:

	var viewModel = { 
	    price: ko.observable(25.99)
	};
	viewModel.formattedPrice = ko.computed({
	    read: function() {
	        return "$" + this.price().toFixed(2);    
	    },
	    write: function (value) {
	        // Strip out unwanted characters, parse as float, then write the raw data back to the underlying "price" observable
	        value = parseFloat(value.replace(/[^\.\d]/g, ""));
	        this.price(isNaN(value) ? 0 : value); // Write to underlying storage
	    },
	    owner: viewModel
	});

It's trivial to bind the formatted price to a text box:

    <p>Enter bid price: <input data-bind="value: formattedPrice"/></p>

Now, whenever the user enters a new price, the text box immediately updates to show it formatted with the currency symbol and two decimal places, no matter what format they entered the value in. This gives a great user experience, because the user sees how the software has understood their data entry as a price. They know they can't enter more than two decimal places, because if they try to, the additional decimal places are immediately removed. Similarly, they can't enter negative values, because the `write` callback strips off any minus sign.
 
### Example 3: Filtering and validating user input

Example 1 showed how a writeable computed observable can effectively *filter* its incoming data by choosing not to write certain values back to the underlying observables if they don't meet some criteria. It ignored full name values that didn't include a space.

Taking this a step further, you could also toggle an `isValid` flag depending on whether the latest input was satisfactory, and display a message in the UI accordingly. I'll explain in a moment an easier way of doing validation, but first consider the following view model, which demonstrates the mechanism:

	var viewModel = { 
	    acceptedNumericValue: ko.observable(123),
	    lastInputWasValid: ko.observable(true)
	};
	viewModel.attemptedValue = ko.computed({
	    read: viewModel.acceptedNumericValue,
	    write: function (value) {
	        if (isNaN(value))
	            this.lastInputWasValid(false);    
	        else {
	            this.lastInputWasValid(true);
	            this.acceptedNumericValue(value); // Write to underlying storage
	        }
	    },
	    owner: viewModel
	});

... with the following DOM elements:

	<p>Enter a numeric value: <input data-bind="value: attemptedValue"/></p>
	<div data-bind="visible: !lastInputWasValid()">That's not a number!</div>

Now, `acceptedNumericValue` will only ever contain numeric values, and any other values entered will trigger the appearance of a validation message instead of updating `acceptedNumericValue`.

**Note:** For such trivial requirements as validating that an input is numeric, this technique is overkill. It would be far easier just to use jQuery Validation and its `number` class on the `<input>` element. Knockout and jQuery Validation work together nicely, as demonstrated on the [grid editor](../examples/gridEditor.html) example. However, the preceding example demonstrates a more general mechanism for filtering and validating with custom logic to control what kind of user feedback appears, which may be of use if your scenario is more complex than jQuery Validation handles natively.

# How dependency tracking works

*Beginners don't need to know about this, but more advanced developers will want to know why I keep making all these claims about KO automatically tracking dependencies and updating the right parts of the UI...*

It's actually very simple and rather lovely. The tracking algorithm goes like this:

1. Whenever you declare a computed observable, KO immediately invokes its evaluator function to get its initial value.
1. While your evaluator function is running, KO keeps a log of any observables (or computed observables) that your evaluator reads the value of.
1. When your evaluator is finished, KO sets up subscriptions to each of the observables (or computed observables) that you've touched. The subscription callback is set to cause your evaluator to run again, looping the whole process back to step 1 (disposing of any old subscriptions that no longer apply).
1. KO notifies any subscribers about the new value of your computed observable.

So, KO doesn't just detect your dependencies the first time your evaluator runs - it redetects them every time. This means, for example, that your dependencies can vary dynamically: dependency A could determine whether you also depend on B or C. Then, you'll only be re-evaluated when either A or your current choice of B or C changes.  You don't have to declare dependencies: they're inferred at runtime from the code's execution.

The other neat trick is that declarative bindings (which includes the output from templates) are simply implemented as computed observables. So, if a template reads the value of an observable, that template binding becomes dependent on that observable, which causes that template binding to be re-evaluated if the observable changes. Nested templates work automatically: if template X renders template Y which reads the value of observable Z, then when Z changes, only Y directly touched it, so that's the only part of the screen that gets re-rendered.