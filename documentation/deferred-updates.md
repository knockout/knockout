---
layout: documentation
title: Deferred updates
---

*Note: This documentation applies to Knockout 3.4.0 and later. For previous versions, the [Deferred Updates](https://github.com/mbest/knockout-deferred-updates) plugin provides similar support.*

In complex applications, with multiple, intertwined dependencies, updating a single [observable](observables.html) might trigger a cascade of [computed observables](computedObservables.html), manual subscriptions, and UI binding updates. These updates can be expensive and inefficient if unnecessary intermediate values are pushed to the view or result in extra computed observable evaluations. Even in a simple application, updating related observables or a single observable multiple times (such as filling an [observable array](observableArrays.html)) can have a similar effect.

Using deferred updates ensures that computed observables and bindings are updated only after their dependencies are stable. Even if an observable might go through multiple intermediate values, only the latest value is used to update its dependencies. To facilitate this, all notifications become asynchronous, scheduled using the [Knockout microtask queue](microtasks.html). This may sound very similar to [rate-limiting](rateLimit-observable.html), which also helps prevent extra notifications, but deferred updates can provide these benefits across an entire application without adding delays. Here's how notification scheduling differs between the standard, deferred, and rate-limited modes:

* *Standard* – Notifications happen immediately and synchronously. Dependencies are often notified of intermediate values.
* *Deferred* – Notifications happen asynchronously, immediately after the current task and generally before any UI redraws.
* *Rate-limited* – Notifications happen after the specified period of time (a minimum of 2-10 ms depending on the browser).

## Enabling deferred updates

Deferred updates are turned off by default to provide compatibility with existing applications. To use deferred updates for your application, you must enable it before initializing your viewmodels by setting the following option:

    ko.options.deferUpdates = true;
    
When the `deferUpdates` option is on, all observables, computed observables, and bindings will be set to use deferred updates and notifications. Enabling this feature at the start of creating a Knockout-based application means you do not need to worry about working around the intermediate-value problem, and so can facilitate a cleaner, purely reactive design. But you should take care when enabling deferred updates for an existing application because it will break code that depends on synchronous updates or on notification of intermediate values (although you may be able to [work around these issues](#forcing-deferred-notifications-to-happen-early)).

### Example: Avoiding multiple UI updates

The following is a contrived example to demonstrate the ability of deferred updates to eliminate UI updates of intermediate values and how this can improve performance.

<style>
#deferred-example1 .example {
    display: inline-block;
    padding: 1em;
    margin-right: 2em;
    background: #F6F6EF;
    position: relative;
}
#deferred-example1 .example table {
    margin-bottom: 1em;
}
#deferred-example1 .example td {
    padding: .5em;
}
#deferred-example1 .example .time {
    position: absolute;
    bottom: 1em;
    right: 1em;
}
</style>

{% capture live_example_id %}deferred-example1{% endcapture %}
{% capture live_example_view %}
<!--ko foreach: $root-->
<div class="example">
    <table>
        <tbody data-bind='foreach: data'>
            <tr>
                <td data-bind="text: name"></td>
                <td data-bind="text: position"></td>
                <td data-bind="text: location"></td>
            </tr>
        </tbody>
    </table>
    <button data-bind="click: flipData, text: 'Flip ' + type"></button>
    <div class="time" data-bind="text: (data(), timing() + ' ms')"></div>
</div>
<!--/ko-->

{% endcapture %}

{% capture live_example_viewmodel %}
function AppViewModel(type) {
    this.type = type;
    this.data = ko.observableArray([
        { name: 'Alfred', position: 'Butler', location: 'London' },
        { name: 'Bruce', position: 'Chairman', location: 'New York' }
    ]);
    this.flipData = function () {
        this.starttime = new Date().getTime();
        var data = this.data();
        for (var i = 0; i < 999; i++) {
            this.data([]);
            this.data(data.reverse());
        }
    }
    this.timing = function () {
        return this.starttime ? new Date().getTime() - this.starttime : 0;
    };
}

ko.options.deferUpdates = true;
var vmDeferred = new AppViewModel('deferred');

ko.options.deferUpdates = false;
var vmStandard = new AppViewModel('standard');

ko.applyBindings([vmStandard, vmDeferred]);
{% endcapture %}
{% include live-example-minimal.html %}

## Using deferred updates for specific observables

Even if you don't enable deferred updates for your whole application, you can still benefit from this feature by specifically making certain observables deferred. This is done using the `deferred` extender:

    this.data = ko.observableArray().extend({ deferred: true });

Now we can `push` a bunch of items into the `data` array without worrying about causing excessive UI or computed updates. The `deferred` extender can be applied to any type of observable, including observable arrays and computed observables.

### Example: Avoiding multiple Ajax requests

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

When applied to a computed observable, the `deferred` extender will also avoid excess evaluation of the computed function. Using deferred updates ensures that any sequence of changes to dependencies in the current task will trigger just *one* re-evaluation of the computed observable. For example:

    ko.computed(function() {
        // This evaluation logic is exactly the same as before
        var params = { page: this.pageIndex(), size: this.pageSize() };
        $.getJSON('/Some/Json/Service', params, this.currentPageData);
    }, this).extend({ deferred: true });

Now you can change `pageIndex` and `pageSize` as many times as you like, and the Ajax call will only happen once after you release your thread back to the JavaScript runtime.

## Forcing deferred notifications to happen early

Although deferred, asynchronous notifications are generally better because of fewer UI updates, it can be a problem if you need to update the UI immediately. Sometimes, for proper functionality, you need an intermediate value pushed to the UI. You can accomplish this using the [`ko.tasks.runEarly` method](microtasks.html#advanced-queue-control). For example:

    // remove an item from an array
    var items = myArray.splice(sourceIndex, 1);

    // force updates so the UI will see a delete/add rather than a move
    ko.tasks.runEarly();
    
    // add the item in a new location
    myArray.splice(targetIndex, 0, items[0]);

## Forcing deferred observables to always notify subscribers

When the value of any observable is primitive (a number, string, boolean, or null), the dependents of the observable are by default notified only when it is set to a value that is actually different from before. So, primitive-valued deferred observables notify only when their value is actually different at the end of the current task. In other words, if a primitive-valued deferred observable is changed to a new value and then changed back to the original value, no notification will happen.

To ensure that the subscribers are always notified of an update, even if the value is the same, you would use the `notify` extender:

    ko.options.deferUpdates = true;
    
    myViewModel.fullName = ko.pureComputed(function() {
        return myViewModel.firstName() + " " + myViewModel.lastName();
    }).extend({ notify: 'always' });
    
