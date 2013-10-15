---
layout: documentation
title: Using extenders to augment observables
---

Knockout observables provide the basic features necessary to support reading/writing values and notifying subscribers when that value changes. In some cases, though, you may wish to add additional functionality to an observable. This might include adding additional properties to the observable or intercepting writes by placing a writeable computed observable in front of the observable. Knockout extenders provide an easy and flexible way to do this type of augmentation to an observable.

### How to create an extender
Creating an extender involves adding a function to the `ko.extenders` object. The function takes in the observable itself as the first argument and any options in the second argument. It can then either return the observable or return something new like a computed observable that uses the original observable in some way.

 This simple `logChange` extender subscribes to the observable and uses the console to write any changes along with a configurable message.

    ko.extenders.logChange = function(target, option) {
        target.subscribe(function(newValue) {
           console.log(option + ": " + newValue);
        });
        return target;
    };

You would use this extender by calling the `extend` function of an observable and passing an object that contains a `logChange` property.

    this.firstName = ko.observable("Bob").extend({logChange: "first name"});

If the `firstName` observable's value was changed to `Ted`, then the console would show `first name: Ted`.

### Live Example 1: Forcing input to be numeric

This example creates an extender that forces writes to an observable to be numeric rounded to a configurable level of precision.  In this case, the extender will return a new writeable computed observable that will sit in front of the real observable intercepting writes.

<style type="text/css">
   .error {  color: red; }
   .error input { border: 1px solid red; }
</style>

{% capture live_example_id %}numericFields{% endcapture %}
{% capture live_example_view %}
<p><input data-bind="value: myNumberOne" /> (round to whole number)</p>
<p><input data-bind="value: myNumberTwo" /> (round to two decimals)</p>
{% endcapture %}

{% capture live_example_viewmodel %}
ko.extenders.numeric = function(target, precision) {
    //create a writeable computed observable to intercept writes to our observable
    var result = ko.computed({
        read: target,  //always return the original observables value
        write: function(newValue) {
            var current = target(),
                roundingMultiplier = Math.pow(10, precision),
                newValueAsNum = isNaN(newValue) ? 0 : parseFloat(+newValue),
                valueToWrite = Math.round(newValueAsNum * roundingMultiplier) / roundingMultiplier;

            //only write if it changed
            if (valueToWrite !== current) {
                target(valueToWrite);
            } else {
                //if the rounded value is the same, but a different value was written, force a notification for the current field
                if (newValue !== current) {
                    target.notifySubscribers(valueToWrite);
                }
            }
        }
    }).extend({ notify: 'always' });

    //initialize with current value to make sure it is rounded appropriately
    result(target());

    //return the new computed observable
    return result;
};

function AppViewModel(one, two) {
    this.myNumberOne = ko.observable(one).extend({ numeric: 0 });
    this.myNumberTwo = ko.observable(two).extend({ numeric: 2 });
}

ko.applyBindings(new AppViewModel(221.2234, 123.4525));
{% endcapture %}

{% include live-example-minimal.html %}

Note that for this to automatically erase rejected values from the UI, it's necessary to use `.extend({ notify: 'always' })` on the computed observable. Without this, it's possible for the user to enter an invalid `newValue` that when rounded gives an unchanged `valueToWrite`. Then, since the model value would not be changing, there would be no notification to update the textbox in the UI. Using `{ notify: 'always' }` causes the textbox to refresh (erasing rejected values) even if the computed property has not changed value.

### Live Example 2: Adding validation to an observable

This example creates an extender that allows an observable to be marked as required. Instead of returning a new object, this extender simply adds additional sub-observables to the existing observable. Since observables are functions, they can actually have their own properties. However, when the view model is converted to JSON, the sub-observables will be dropped and we will simply be left with the value of our actual observable.  This is a nice way to add additional functionality that is only relevant for the UI and does not need to be sent back to the server.

{% capture live_example_id %}requiredFields{% endcapture %}
{% capture live_example_view %}
<p data-bind="css: { error: firstName.hasError }">
    <input data-bind='value: firstName, valueUpdate: "afterkeydown"' />
    <span data-bind='visible: firstName.hasError, text: firstName.validationMessage'> </span>
</p>
<p data-bind="css: { error: lastName.hasError }">
    <input data-bind='value: lastName, valueUpdate: "afterkeydown"' />
    <span data-bind='visible: lastName.hasError, text: lastName.validationMessage'> </span>
</p>
{% endcapture %}

{% capture live_example_viewmodel %}
ko.extenders.required = function(target, overrideMessage) {
    //add some sub-observables to our observable
    target.hasError = ko.observable();
    target.validationMessage = ko.observable();

    //define a function to do validation
    function validate(newValue) {
       target.hasError(newValue ? false : true);
       target.validationMessage(newValue ? "" : overrideMessage || "This field is required");
    }

    //initial validation
    validate(target());

    //validate whenever the value changes
    target.subscribe(validate);

    //return the original observable
    return target;
};

function AppViewModel(first, last) {
    this.firstName = ko.observable(first).extend({ required: "Please enter a first name" });
    this.lastName = ko.observable(last).extend({ required: "" });
}

ko.applyBindings(new AppViewModel("Bob","Smith"));
{% endcapture %}

{% include live-example-minimal.html %}

### Applying multiple extenders

More than one extender can be applied in a single call to the `.extend` method of an observable.

    this.firstName = ko.observable(first).extend({ required: "Please enter a first name", logChange: "first name" });

In this case, both the `required` and `logChange` extenders would be executed against our observable.