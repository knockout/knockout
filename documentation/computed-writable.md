---
layout: documentation
title: Writable computed observables
---

*Beginners may wish to skip this section - writable computed observables are fairly advanced and are not necessary in most situations*

Normally, computed observables have a value that is computed from other observables and are therefore *read-only*. What may seem surprising, then, is that it is possible to make computed observables *writable*. You just need to supply your own callback function that does something sensible with written values.

You can use a writable computed observable exactly like a regular observable, with your own custom logic intercepting all reads and writes. Just like observables, you can write values to multiple observable or computed observable properties on a model object using *chaining syntax*. For example, `myViewModel.fullName('Joe Smith').age(50)`.

Writable computed observables are a powerful feature with a wide range of possible uses.

### Example 1: Decomposing user input

Going back to the classic "first name + last name = full name" example, you can turn things back-to-front: make the `fullName` computed observable writable, so that the user can directly edit the full name, and their supplied value will be parsed and mapped back to the underlying `firstName` and `lastName` observables. In this example, the `write` callback handles incoming values by splitting the incoming text into "firstName" and "lastName" components, and writing those values back to the underlying observables.

{% capture live_example_id %}decompose-input{% endcapture %}
{% capture live_example_viewmodel %}
    function MyViewModel() {
        this.firstName = ko.observable('Planet');
        this.lastName = ko.observable('Earth');

        this.fullName = ko.computed({
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
            owner: this
        });
    }

    ko.applyBindings(new MyViewModel());
{% endcapture %}
{% capture live_example_view %}
    <div>First name: <span data-bind="text: firstName"></span></div>
    <div>Last name: <span data-bind="text: lastName"></span></div>
    <div class="heading">Hello, <input data-bind="value: fullName"/></div>
{% endcapture %}
{% include live-example-minimal.html %}

This is the exact opposite of the [Hello World](../examples/helloWorld.html) example, in that here the first and last names are not editable, but the combined full name is editable.

The preceding view model code demonstrates the *single parameter syntax* for initializing computed observables. See the [computed observable reference](computed-reference.html) for the full list of available options.

### Example 2: Selecting/deselecting all items

When presenting the user with a list of selectable items, it's often useful to include a method to select or deselect all of the items. This can represented quite intuitively with a boolean value that represents whether all items are selected. When set to `true` it will select all items, and when set to `false` it will deselect them.

<style type="text/css">
    #select-all-items label { display: block; }
    #select-all-items .heading { border-bottom: 1px solid black; }
</style>

{% capture live_example_id %}select-all-items{% endcapture %}
{% capture live_example_viewmodel %}
    function MyViewModel() {
        this.produce = [ 'Apple', 'Banana', 'Celery', 'Corn', 'Orange', 'Spinach' ];
        this.selectedProduce = ko.observableArray([ 'Corn', 'Orange' ]);
        this.selectedAllProduce = ko.computed({
            read: function () {
                // Using length is quick and is accurate if only items from the main 
                // array are added to the selected array.
                return this.selectedProduce().length === this.produce.length;
            },
            write: function (value) {
                this.selectedProduce(value ? this.produce.slice(0) : []);
            },
            owner: this
        });
    }
    ko.applyBindings(new MyViewModel());
{% endcapture %}
{% capture live_example_view %}
    <div class="heading">
        <input type="checkbox" data-bind="checked: selectedAllProduce" title="Select all/none"/> Produce
    </div>
    <div data-bind="foreach: produce">
        <label>
            <input type="checkbox" data-bind="checkedValue: $data, checked: $parent.selectedProduce"/>
            <span data-bind="text: $data"></span>
        </label>
    </div>
{% endcapture %}
{% include live-example-minimal.html %}

### Example 3: A value converter

Sometimes you might want to represent a data point on the screen in a different format than its underlying storage. For example, you might want to store a price as a raw float value, but let the user edit it with a currency symbol and fixed number of decimal places. You can use a writable computed observable to represent the formatted price, mapping incoming values back to the underlying float value:

{% capture live_example_id %}value-converter{% endcapture %}
{% capture live_example_viewmodel %}
    function MyViewModel() {
        this.price = ko.observable(25.99);

        this.formattedPrice = ko.computed({
            read: function () {
                return '$' + this.price().toFixed(2);
            },
            write: function (value) {
                // Strip out unwanted characters, parse as float, then write the raw data back to the underlying "price" observable
                value = parseFloat(value.replace(/[^\.\d]/g, ""));
                this.price(isNaN(value) ? 0 : value); // Write to underlying storage
            },
            owner: this
        });
    }

    ko.applyBindings(new MyViewModel());
{% endcapture %}
{% capture live_example_view %}
    <div>Enter bid price: <input data-bind="value: formattedPrice"/></div>
    <div>Raw value: <span data-bind="text: price"></span></div>
{% endcapture %}
{% include live-example-minimal.html %}

Now, whenever the user enters a new price, the text box immediately updates to show it formatted with the currency symbol and two decimal places, no matter what format they entered the value in. This gives a great user experience, because the user sees how the software has understood their data entry as a price. They know they can't enter more than two decimal places, because if they try to, the additional decimal places are immediately removed. Similarly, they can't enter negative values, because the `write` callback strips off any minus sign.

### Example 4: Filtering and validating user input

Example 1 showed how a writable computed observable can effectively *filter* its incoming data by choosing not to write certain values back to the underlying observables if they don't meet some criteria. It ignored full name values that didn't include a space.

Taking this a step further, you could also toggle an `isValid` flag depending on whether the latest input was satisfactory, and display a message in the UI accordingly. There's an easier way of doing validation (explained below), but first consider the following example, which demonstrates the mechanism:

<style type="text/css">
    #validate-input .error { color: #A71500; font-weight: bold;  }
</style>

{% capture live_example_id %}validate-input{% endcapture %}
{% capture live_example_viewmodel %}
    function MyViewModel() {
        this.acceptedNumericValue = ko.observable(123);
        this.lastInputWasValid = ko.observable(true);

        this.attemptedValue = ko.computed({
            read: this.acceptedNumericValue,
            write: function (value) {
                if (isNaN(value))
                    this.lastInputWasValid(false);
                else {
                    this.lastInputWasValid(true);
                    this.acceptedNumericValue(value); // Write to underlying storage
                }
            },
            owner: this
        });
    }

    ko.applyBindings(new MyViewModel());
{% endcapture %}
{% capture live_example_view %}
    <div>Enter a numeric value: <input data-bind="value: attemptedValue"/></div>
    <div class="error" data-bind="visible: !lastInputWasValid()">That's not a number!</div>
{% endcapture %}
{% include live-example-minimal.html %}

Now, `acceptedNumericValue` will only ever contain numeric values, and any other values entered will trigger the appearance of a validation message instead of updating `acceptedNumericValue`.

**Note:** For such trivial requirements as validating that an input is numeric, this technique is overkill. It would be far easier just to use jQuery Validation and its `number` class on the `<input>` element. Knockout and jQuery Validation work together nicely, as demonstrated on the [grid editor](../examples/gridEditor.html) example. However, the preceding example demonstrates a more general mechanism for filtering and validating with custom logic to control what kind of user feedback appears, which may be of use if your scenario is more complex than jQuery Validation handles natively.

