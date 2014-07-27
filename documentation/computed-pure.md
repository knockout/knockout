---
layout: documentation
title: Pure computed observables
---

*Pure* computed observables, introduced in Knockout 3.2.0, provide performance and memory benefits over regular computed observables for most applications. This is because a *pure* computed observable doesn't maintain subscriptions to its dependencies when it has no subscribers itself. This feature:

 * **Prevents memory leaks** from computed observables that are no longer referenced in an application but whose dependencies still exist.
 * **Reduces computation overhead** by not re-calculating computed observables whose value isn't being observed.

A *pure* computed observable automatically switches between two states based on whether it has subscribers.

1. Whenever it has *no* subscribers, it is ***sleeping***. When entering the *sleeping* state, it disposes all subscriptions to its dependencies. During this state, it will not subscribe to any observables accessed in the evaluator function (although it does *count* them so that `getDependenciesCount()` is always accurate). If the computed observable's value is read while it is *sleeping*, it is always re-evaluated to ensure that the value is current.

2. Whenever it has *any* subscribers, it is ***listening***. When entering the *listening* state, it immediately invokes the evaluator function and subscribes to any observables that are accessed. In this state, it operates just like a regular computed observable, as described in [how dependency tracking works](computed-dependency-tracking.md).

#### Why "pure"? {#pure-computed-function-defined}

We've borrowed the term from [pure functions](http://en.wikipedia.org/wiki/Pure_function) because this feature is generally only applicable for computed observables whose evaluator is a *pure function* as follows:

1. Evaluating the computed observable should not cause any side effects.
2. The value of the computed observable shouldn't vary based on the number of evaluations or other "hidden" information. Its value should be based solely on the values of other observables in the application, which for the pure function definition, are considered its parameters.

#### Syntax

The standard method of defining a *pure* computed observable is to use `ko.pureComputed`:

    this.fullName = ko.pureComputed(function() {
        return this.firstName() + " " + this.lastName();
    }, this);
    
Alternatively, you can use the `pure` option with `ko.computed`:

    this.fullName = ko.computed(function() {
        return this.firstName() + " " + this.lastName();
    }, this, { pure: true });
    
For complete syntax, see the [computed observable reference](computed-reference.html).

### When to use a *pure* computed observable

You can use the *pure* feature for any computed observable that follows the [*pure function* guidelines](#pure-computed-function-defined). You'll see the most benefit, though, when it is applied to application designs that involve persistent view models that are used and shared by temporary views and view models. Using *pure* computed observables in a persistent view model provides computation performance benefits ([but not always](#using-pure-computed-can-hurt-performance)). Using them in temporary view models provides memory management benefits.

In the following example of a simple wizard interface, the `fullName` *pure* computed is only bound to the view during the final step and is thus only updated when that step is active.

<style>
#wizard-example {
    position: relative;
    height: 6.5em;
}
#wizard-example .log {
    float: right;
    height: 6em;
    background: white;
    border: 1px solid black;
    width: 20em;
    overflow-y: scroll;
}
#wizard-example button {
    position: absolute;
    bottom: 1em;
}
</style>

{% capture live_example_id %}wizard-example{% endcapture %}
{% capture live_example_view %}
<div class="log" data-bind="text: computedLog"></div>
<!--ko if: step() == 0-->
    <p>First name: <input data-bind="textInput: firstName" /></p>
<!--/ko-->
<!--ko if: step() == 1-->
    <p>Last name: <input data-bind="textInput: lastName" /></p>
<!--/ko-->
<!--ko if: step() == 2-->
    <div>Prefix: <select data-bind="value: prefix, options: ['Mr.', 'Ms.','Mrs.','Dr.']"></select></div>
    <h2>Hello, <span data-bind="text: fullName"> </span>!</h2>
<!--/ko-->
<p><button type="button" data-bind="click: next">Next</button></p>
{% endcapture %}

{% capture live_example_viewmodel %}
function AppData() {
    this.firstName = ko.observable('John');
    this.lastName = ko.observable('Burns');
    this.prefix = ko.observable('Dr.');
    this.computedLog = ko.observable('Log: ');
    this.fullName = ko.pureComputed(function () {
        var value = this.prefix() + " " + this.firstName() + " " + this.lastName();
        // Normally, you should avoid writing to observables within a pure computed 
        // observable (avoiding side effects). But this example is meant to demonstrate 
        // its internal workings, and writing a log is a good way to do so.
        this.computedLog(this.computedLog.peek() + value + '; ');
        return value;
    }, this);

    this.step = ko.observable(0);
    this.next = function () {
        this.step(this.step() === 2 ? 0 : this.step()+1);
    };
};
ko.applyBindings(new AppData());
{% endcapture %}

{% include live-example-minimal.html %}

### When *not* to use a *pure* computed observable

#### Side effects

You should not use the *pure* feature for a computed observable that is meant to perform an action when its dependencies change. Examples include:

* Using a computed observable to run a callback based on multiple observables.

        ko.computed(function () {
            var cleanData = ko.toJS(this);
            myDataClient.update(cleanData);
        }, this);
    
* In a binding's `init` function, using a computed observable to update the bound element.

        ko.computed({
            read: function () {
                element.title = ko.unwrap(valueAccessor());
            },
            disposeWhenNodeIsRemoved: element
        });

#### Performance {#using-pure-computed-can-hurt-performance}

There may be cases when using the *pure* feature for a computed observable results in higher computation overhead. A regular computed observable is re-evaluated only when one of its dependencies changes. But a *pure* computed observable is also re-evaluated each time it is accessed while *sleeping* and whenever it enters the *listening* state. Thus it is possible for a computed observable to be re-evaluated more often when using the *pure* feature than it would be otherwise.

