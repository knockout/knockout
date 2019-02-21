---
layout: documentation
title: Pure computed observables
---

*Pure* computed observables, introduced in Knockout 3.2.0, provide performance and memory benefits over regular computed observables for most applications. This is because a *pure* computed observable doesn't maintain subscriptions to its dependencies when it has no subscribers itself. This feature:

 * **Prevents memory leaks** from computed observables that are no longer referenced in an application but whose dependencies still exist.
 * **Reduces computation overhead** by not re-calculating computed observables whose value isn't being observed.

A *pure* computed observable automatically switches between two states based on whether it has `change` subscribers.

1. Whenever it has *no* `change` subscribers, it is ***sleeping***. When entering the *sleeping* state, it disposes all subscriptions to its dependencies. During this state, it will not subscribe to any observables accessed in the evaluator function (although it does keep track of them). If the computed observable's value is read while it is *sleeping*, it is automatically re-evaluated if any of its dependencies have changed.

2. Whenever it has *any* `change` subscribers, it is awake and ***listening***. When entering the *listening* state, it immediately subscribes to any dependencies. In this state, it operates just like a regular computed observable, as described in [how dependency tracking works](computed-dependency-tracking.html).

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

You can use the *pure* feature for any computed observable that follows the [*pure function* guidelines](#pure-computed-function-defined). You'll see the most benefit, though, when it is applied to application designs that involve persistent view models that are used and shared by temporary views and view models. Using *pure* computed observables in a persistent view model provides computation performance benefits. Using them in temporary view models provides memory management benefits.

In the following example of a simple wizard interface, the `fullName` *pure* computed is only bound to the view during the final step and so is only updated when that step is active.

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

The reason you shouldn't use a *pure* computed if the evaluator has important side effects is simply that the evaluator will not run whenever the computed has no active subscribers (and so is sleeping). If it's important for the evaluator to always run when dependencies change, use a [regular computed](computedObservables.html) instead.

### Determining if a property is a pure computed observable

In some scenarios, it is useful to programmatically determine if you are dealing with a pure computed observable. Knockout provides a utility function, `ko.isPureComputed` to help with this situation. For example, you might want to exclude non-pure computed observables from data that you are sending back to the server.

    var result = {};
    ko.utils.objectForEach(myObject, function (name, value) {
        if (!ko.isComputed(value) || ko.isPureComputed(value)) {
            result[name] = value;
        }
    });

### State-change notifications

A pure computed observable notifies some events that allow you to respond to changes to the state of the observable. 

  - `awake` — Whenever the computed observable enters the *listening* state, it notifies an `awake` event using its current value. (The `awake` event also applies to normal computed observables created with the `deferEvaluation` option.) You won't normally need to know about the internal state of your observables. But since the internal state can correspond to whether the observable is bound to the view or not, you might use that information to do some view-model initialization or cleanup.

        this.someComputedThatWillBeBound = ko.pureComputed(function () {
            ...
        }, this);

        this.someComputedThatWillBeBound.subscribe(function () {
            // do something when this is bound
        }, this, "awake");

  - `asleep` — Whevener the computed observable enters the *sleeping* state, it notifies an `asleep` event with a value of `undefined`.

        this.someComputedThatWillBeBound.subscribe(function () {
            // do something when this is un-bound
        }, this, "asleep");

  - `spectate` — Whenever the computed observable **records** a change to its value, even while sleeping, it notifies a `spectate` event with the new value. (The `spectate` event applies to any type of observable but is generally most useful for pure computed observables.) This event allows you to track the current value of the observable without affecting its sleeping/waking state. Also note that when using rate-limiting or deferred updates, the "spectated" values might include intermediate values that aren't captured by `change` notifications.

### Status of a disposed pure computed observable

You can manually dispose a computed observable by calling its `dispose` function, which clears all subscriptions to its dependencies. It is also automatically disposed if its evaluator function doesn't access any observables. Although you can continue to access the most recent value of a disposed computed observable, its evaluator function will not be run again. Additionally, a disposed *pure* computed observables is neither awake nor asleep, and does not notify state-change events. To determine if a computed observable is disposed, call `myComputed.isActive()`.
