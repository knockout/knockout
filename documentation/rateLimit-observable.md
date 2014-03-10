---
layout: documentation
title: Rate-limiting observable notifications
---

*Note: This rate-limit API was added in Knockout 3.1.0. For previous versions, the [`throttle` extender](throttle-extender.html) provides similar functionality.*

Normally, an [observable](observables.html) that is changed notifies its subscribers immediately, so that any computed observables or bindings that depend on the observable are updated synchronously. The `rateLimit` extender, however, causes an observable to suppress and delay change notifications for a specified period of time. A rate-limited observable therefore updates dependencies asynchronously.

The `rateLimit` extender can be applied to any type of observable, including [observable arrays](observableArrays.html) and [computed observables](computedObservables.html). The main use cases for rate-limiting are:

 * Making things respond after a certain delay
 * Combining multiple changes into a single update

### Applying the rateLimit extender

`rateLimit` supports two parameter formats:

    // Shorthand: Specify just a timeout in milliseconds
    someObservableOrComputed.extend({ rateLimit: 500 });

    // Longhand: Specify timeout and/or method
    someObservableOrComputed.extend({ rateLimit: { timeout: 500, method: "notifyWhenChangesStop" } });

The `method` option controls when notifications fire, and accepts the following values:

1. `notifyAtFixedRate` --- **Default value if not otherwise specified**. The notification happens after the specified period of time from the first change to the observable (either initially or since the previous notification).

2. `notifyWhenChangesStop` --- The notification happens after no changes have occured to the observable for the specified period of time. Each time the observable changes, that timer is reset, so notifications cannot happen if the observable continuously changes more frequently than the timeout period.

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
<p>Type stuff here: <input data-bind='value: instantaneousValue,
    valueUpdate: ["input", "afterkeydown"]' /></p>
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
    this.delayedValue = ko.computed(this.instantaneousValue)
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

### Example 3: Avoiding multiple Ajax requests

The following model represents data that you could render as a paged grid:

    function GridViewModel() {
        this.pageSize = ko.observable(20);
        this.pageIndex = ko.observable(1);
        this.currentPageData = ko.observableArray();

        // Query /Some/Json/Service whenever pageIndex or pageSize changes,
        // and use the results to update currentPageData
        ko.computed(function() {
            var params = { page: this.pageIndex(), size: this.pageSize() };
            $.getJSON('/Some/Json/Service', params, this.currentPageData);
        }, this);
    }

Because the computed observable evaluates both `pageIndex` and `pageSize`, it becomes dependent on both of them. So, this code will use jQuery's [`$.getJSON` function](http://api.jquery.com/jQuery.getJSON/) to reload `currentPageData` when a `GridViewModel` is first instantiated *and* whenever the `pageIndex` or `pageSize` properties are later changed.

This is very simple and elegant (and it's trivial to add yet more observable query parameters that also trigger a refresh automatically whenever they change), but there is a potential efficiency problem. Suppose you add the following function to `GridViewModel` that changes both `pageIndex` and `pageSize`:

    this.setPageSize = function(newPageSize) {
        // Whenever you change the page size, we always reset the page index to 1
        this.pageSize(newPageSize);
        this.pageIndex(1);
    }

The problem is that this will cause *two* Ajax requests: the first one will start when you update `pageSize`, and the second one will start immediately afterwards when you update `pageIndex`. This is a waste of bandwidth and server resources, and a source of unpredictable race conditions.

When applied to a computed observable, the `rateLimit` extender will also avoid excess evaluation of the computed function. Using a short rate-limit timeout (e.g., 0 milliseconds) ensures that any sequence of synchronous changes to dependencies will trigger just *one* re-evaluation of your computed observable. For example:

    ko.computed(function() {
        // This evaluation logic is exactly the same as before
        var params = { page: this.pageIndex(), size: this.pageSize() };
        $.getJSON('/Some/Json/Service', params, this.currentPageData);
    }, this).extend({ rateLimit: 0 });

Now you can change `pageIndex` and `pageSize` as many times as you like, and the Ajax call will only happen once after you release your thread back to the JavaScript runtime.

## Special consideration for computed observables

For a computed observable, the rate-limit timer is triggered when one of the computed observable's dependencies change instead of when its value changes. The computed observable is not re-evaluated until its value is actually needed---after the timeout period when the change notification should happen, or when the computed observable value is accessed directly. If you need to access the value of the computed's most recent evaluation, you can do so with the `peek` method.

## Forcing rate-limited observables to always notify subscribers

When the value of any observable is primitive (a number, string, boolean, or null), the dependents of the observable are by default notified only when it is set to a value that is actually different from before. So, primitive-valued rate-limited observables notify only when their value is actually different at the end of the timeout period. In other words, if a primitive-valued rate-limited observable is changed to a new value and then changed back to the original value before the timeout period ends, no notification will happen.

If you want to ensure that the subscribers are always notified of an update, even if the value is the same, you would use the `notify` extender in addition to `rateLimit`:

    myViewModel.fullName = ko.computed(function() {
        return myViewModel.firstName() + " " + myViewModel.lastName();
    }).extend({ notify: 'always', rateLimit: 500 });

## Comparison with the throttle extender

If you'd like to migrate code from using the deprecated `throttle` extender, you should note the following ways that the `rateLimit` extender is different from the `throttle` extender.

When using `rateLimit`:

1. *Writes* to observables are not delayed; the observable's value is updated right away. For writable computed observables, this means that the write function is always run right away.
2. All `change` notifications are delayed, including when calling `valueHasMutated` manually. This means you can't use `valueHasMutated` to force a rate-limited observable to notify an un-changed value.
3. The default rate-limit method is different from the `throttle` algorithm. To match the `throttle` behavior, use the `notifyWhenChangesStop` method.
4. Evaluation of a rate-limited computed observable isn't rate-limited; it will re-evaluate if you read its value.
