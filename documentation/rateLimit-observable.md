---
layout: documentation
title: Rate-limiting observable notifications
---

*Note: This rate-limit API was added in Knockout 3.1.0. For previous versions, the [`throttle` extender](throttle-extender.html) provides similar functionality.*

Normally, an [observable](observables.html) that is changed notifies its subscribers immediately, so that any computed observables or bindings that depend on the observable are updated synchronously. The `rateLimit` extender, however, causes an observable to suppress and delay change notifications for a specified period of time. A rate-limited observable therefore updates dependencies asynchronously.

The `rateLimit` extender can be applied to any type of observable, including [observable arrays](observableArrays.html) and [computed observables](computedObservables.html). The main use cases for rate-limiting are:

 * Making things respond after a certain delay
 * Combining multiple changes into a single update
 
If you only need to combine updates without adding a delay, [deferred updates](deferred-updates.html) provides a more efficient method.

### Applying the rateLimit extender

`rateLimit` supports two parameter formats:

    // Shorthand: Specify just a timeout in milliseconds
    someObservableOrComputed.extend({ rateLimit: 500 });

    // Longhand: Specify timeout and/or method
    someObservableOrComputed.extend({ rateLimit: { timeout: 500, method: "notifyWhenChangesStop" } });

The `method` option controls when notifications fire, and accepts any of the following values:

1. `"notifyAtFixedRate"` --- **Default value if not otherwise specified**. The notification happens after the specified period of time from the first change to the observable (either initially or since the previous notification).

2. `"notifyWhenChangesStop"` --- The notification happens after no changes have occured to the observable for the specified period of time. Each time the observable changes, that timer is reset, so notifications cannot happen if the observable continuously changes more frequently than the timeout period.

3. A custom function that will handle the scheduling of notifications. For example, you could use Underscore's `throttle` method: `myObservable.extend({ rateLimit: { timeout: 500, method: _.throttle } });` For more details, see the section below on custom rate-limit methods.

### Example 1: The basics

Consider the observables in the following code:

    var name = ko.observable('Bert');

    var upperCaseName = ko.computed(function() {
        return name().toUpperCase();
    });

Normally, if you change `name` as follows:

    name('The New Bert');

... then `upperCaseName` will be recomputed immediately, before your next line of code runs. But if you instead define `name` using `rateLimit` as follows:

    var name = ko.observable('Bert').extend({ rateLimit: 500 });

... then `upperCaseName` will not be recomputed immediately when `name` changes---instead, `name` will wait for 500 milliseconds (half a second) before notifying its new value to `upperCaseName`, which will then recompute its value. No matter how many times `name` is changed during those 500 ms, `upperCaseName` will only be updated once with the most recent value.

### Example 2: Doing something when the user stops typing

In this live example, there's an `instantaneousValue` observable that reacts immediately when you press a key. This is then wrapped inside a `delayedValue` computed observable that's configured to notify only when changes stop for at least 400 milliseconds, using the `notifyWhenChangesStop` rate-limit method.

Try it:

{% capture live_example_view %}
<p>Type stuff here: <input data-bind='textInput: instantaneousValue' /></p>
<p>Current delayed value: <b data-bind='text: delayedValue'> </b></p>

<div data-bind="visible: loggedValues().length > 0">
    <h3>Stuff you have typed:</h3>
    <ul data-bind="foreach: loggedValues">
        <li data-bind="text: $data"></li>
    </ul>
</div>
{% endcapture %}

{% capture live_example_viewmodel %}
function AppViewModel() {
    this.instantaneousValue = ko.observable();
    this.delayedValue = ko.pureComputed(this.instantaneousValue)
        .extend({ rateLimit: { method: "notifyWhenChangesStop", timeout: 400 } });

    // Keep a log of the throttled values
    this.loggedValues = ko.observableArray([]);
    this.delayedValue.subscribe(function (val) {
        if (val !== '')
            this.loggedValues.push(val);
    }, this);
}

ko.applyBindings(new AppViewModel());
{% endcapture %}
{% include live-example-minimal.html %}

## Custom rate-limit methods

Knockout 3.5 introduced the ability to specify a custom rate-limit method by passing a function to the `rateLimit` extender rather than just a string. The function is called with three parameters (function, timeout, options) and must return a new, rate-limited function. Whenever the observable has a possibly new value to notify, it will call the returned function, which should then call the original function after some delay based on the rules of the custom method. For example, here is a function that implements *debounce* but also immediately notifies the initial value:

    function debounceSubsequentChanges(action, timeout) {
        var timeoutInstance;
        return function () {
            if (!timeoutInstance) {
                action();
                timeoutInstance = setTimeout(function () {
                    timeoutInstance = undefined;
                }, timeout);
            } else {
                clearTimeout(timeoutInstance);
                timeoutInstance = setTimeout(function() {
                    timeoutInstance = undefined;
                    action();
                }, timeout);
            }
        };
    }
    
Your function can also accept a third parameter, an object that includes any additional parameters passed to the `rateLimit` extender.

## Special consideration for computed observables

For a computed observable, the rate-limit timer is triggered when one of the computed observable's dependencies change instead of when its value changes. The computed observable is not re-evaluated until its value is actually needed---after the timeout period when the change notification should happen, or when the computed observable value is accessed directly. If you need to access the value of the computed's most recent evaluation, you can do so with the `peek` method.

## Forcing rate-limited observables to always notify subscribers

When the value of any observable is primitive (a number, string, boolean, or null), the dependents of the observable are by default notified only when it is set to a value that is actually different from before. So, primitive-valued rate-limited observables notify only when their value is actually different at the end of the timeout period. In other words, if a primitive-valued rate-limited observable is changed to a new value and then changed back to the original value before the timeout period ends, no notification will happen.

If you want to ensure that the subscribers are always notified of an update, even if the value is the same, you would use the `notify` extender in addition to `rateLimit`:

    myViewModel.fullName = ko.computed(function() {
        return myViewModel.firstName() + " " + myViewModel.lastName();
    }).extend({ notify: 'always', rateLimit: 500 });
    
## Comparison with deferred updates

Knockout version 3.4.0 added support for [*deferred updates*](deferred-updates.html), which works similarly to rate-limiting by making notifications and updates asynchronous. But instead of using a timed delay, deferred updates are processed as soon as possible after the current task, before yielding for I/O, reflow, or redrawing. If you are upgrading to 3.4.0 and have code that uses a short rate-limit timeout (e.g., 0 milliseconds), you could modify it to use deferred updates instead:

    ko.computed(function() {
        // ....
    }).extend({ deferred: true });
    
## Comparison with the throttle extender

If you'd like to migrate code from using the deprecated `throttle` extender, you should note the following ways that the `rateLimit` extender is different from the `throttle` extender.

When using `rateLimit`:

1. *Writes* to observables are not delayed; the observable's value is updated right away. For writable computed observables, this means that the write function is always run right away.
2. All `change` notifications are delayed, including when calling `valueHasMutated` manually. This means you can't use `valueHasMutated` to force a rate-limited observable to notify an un-changed value.
3. The default rate-limit method is different from the `throttle` algorithm. To match the `throttle` behavior, use the `notifyWhenChangesStop` method.
4. Evaluation of a rate-limited computed observable isn't rate-limited; it will re-evaluate if you read its value.
