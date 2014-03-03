---
layout: documentation
title: Computed Observables
---

What if you've got an [observable](observables.html) for `firstName`, and another for `lastName`, and you want to display the full name? That's where *computed observables* come in - these are functions that are dependent on one or more other observables, and will automatically update whenever any of these dependencies change.

For example, given the following view model class,

    function AppViewModel() {
        this.firstName = ko.observable('Bob');
        this.lastName = ko.observable('Smith');
    }

... you could add a computed observable to return the full name:

    function AppViewModel() {
        // ... leave firstName and lastName unchanged ...

        this.fullName = ko.computed(function() {
            return this.firstName() + " " + this.lastName();
        }, this);
    }

Now you could bind UI elements to it, e.g.:

    The name is <span data-bind="text: fullName"></span>

... and they will be updated whenever `firstName` or `lastName` changes (your evaluator function will be called once each time any of its dependencies change, and whatever value you return will be passed on to the observers such as UI elements or other computed observables).

### Managing 'this'

*Beginners may wish to skip this section - as long as you follow the same coding patterns as the examples, you won't need to know or care about it!*

In case you're wondering what the second parameter to `ko.computed` is (the bit where we passed `this` in the preceding code), that defines the value of `this` when evaluating the computed observable. Without passing it in, it would not have been possible to refer to `this.firstName()` or `this.lastName()`. Experienced JavaScript coders will regard this as obvious, but if you're still getting to know JavaScript it might seem strange. (Languages like C# and Java never expect the programmer to set a value for `this`, but JavaScript does, because its functions themselves aren't part of any object by default.)

#### A popular convention that simplifies things

There's a popular convention for avoiding the need to track `this` altogether: if your viewmodel's constructor copies a reference to `this` into a different variable (traditionally called `self`), you can then use `self` throughout your viewmodel and don't have to worry about it being redefined to refer to something else. For example:

    function AppViewModel() {
        var self = this;

        self.firstName = ko.observable('Bob');
        self.lastName = ko.observable('Smith');
        self.fullName = ko.computed(function() {
            return self.firstName() + " " + self.lastName();
        });
    }

Because `self` is captured in the function's closure, it remains available and consistent in any nested functions, such as the `ko.computed` evaluator. This convention is even more useful when it comes to event handlers, as you'll see in many of the [live examples](../examples/).

### Dependency chains just work

Of course, you can create whole chains of computed observables if you wish. For example, you might have:

* an **observable** called `items` representing a set of items
* another **observable** called `selectedIndexes` storing which item indexes have been 'selected' by the user
* a **computed observable** called `selectedItems` that returns an array of item objects corresponding to the selected indexes
* another **computed observable** that returns `true` or `false` depending on whether any of `selectedItems` has some property (like being new or being unsaved). Some UI element, like a button, might be enabled or disabled based on this value.

Then, changes to `items` or `selectedIndexes` will ripple through the chain of computed observables, which in turn updates any UI bound to them. Very tidy and elegant.

### Forcing computed observables to always notify subscribers

When a computed observable returns a primitive value (a number, string, boolean, or null), the dependencies of the observable are normally only notified if the value actually changed. However, it is possible to use the built-in `notify` [extender](extenders.html) to ensure that a computed observable's subscribers are always notified on an update, even if the value is the same. You would apply the extender like this:

    myViewModel.fullName = ko.computed(function() {
        return myViewModel.firstName() + " " + myViewModel.lastName();
    }).extend({ notify: 'always' });

### Delaying and/or suppressing change notifications

Normally, a computed observable updates and notifies its subscribers immediately, as soon as its dependencies change. But if a computed observable has many dependencies or involves expensive updates, you may get better performance by limiting or delaying the computed observable's updates and notifications. This is accomplished using the [`rateLimit` extender](rateLimit-observable.html) like this:

    // Ensure updates no more than once per 50-millisecond period
    myViewModel.fullName.extend({ rateLimit: 50 });
    
# Writeable computed observables

*Beginners may wish to skip this section - writeable computed observables are fairly advanced and are not necessary in most situations*

As you've learned, computed observables have a value that is computed from other observables. In that sense, computed observables are normally *read-only*. What may seem surprising, then, is that it is possible to make computed observables *writeable*. You just need to supply your own callback function that does something sensible with written values.

You can then use your writeable computed observable exactly like a regular observable, with your own custom logic intercepting all reads and writes. This is a powerful feature with a wide range of possible uses. Just like observables, you can write values to multiple observable or computed observable properties on a model object using *chaining syntax*. For example, `myViewModel.fullName('Joe Smith').age(50)`.

### Example 1: Decomposing user input

Going back to the classic "first name + last name = full name" example, you can turn things back-to-front: make the `fullName` computed observable writeable, so that the user can directly edit the full name, and their supplied value will be parsed and mapped back to the underlying `firstName` and `lastName` observables:

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

In this example, the `write` callback handles incoming values by splitting the incoming text into "firstName" and "lastName" components, and writing those values back to the underlying observables. You can bind this view model to your DOM in the obvious way, as follows:

    <p>First name: <span data-bind="text: firstName"></span></p>
    <p>Last name: <span data-bind="text: lastName"></span></p>
    <h2>Hello, <input data-bind="value: fullName"/>!</h2>

This is the exact opposite of the [Hello World](../examples/helloWorld.html) example, in that here the first and last names are not editable, but the combined full name is editable.

The preceding view model code demonstrates the *single parameter syntax* for initializing computed observables. See the [computed observable reference](#computed_observable_reference) below for the full list of available options.

### Example 2: A value converter

Sometimes you might want to represent a data point on the screen in a different format from its underlying storage. For example, you might want to store a price as a raw float value, but let the user edit it with a currency symbol and fixed number of decimal places. You can use a writeable computed observable to represent the formatted price, mapping incoming values back to the underlying float value:

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

It's trivial to bind the formatted price to a text box:

    <p>Enter bid price: <input data-bind="value: formattedPrice"/></p>

Now, whenever the user enters a new price, the text box immediately updates to show it formatted with the currency symbol and two decimal places, no matter what format they entered the value in. This gives a great user experience, because the user sees how the software has understood their data entry as a price. They know they can't enter more than two decimal places, because if they try to, the additional decimal places are immediately removed. Similarly, they can't enter negative values, because the `write` callback strips off any minus sign.

### Example 3: Filtering and validating user input

Example 1 showed how a writeable computed observable can effectively *filter* its incoming data by choosing not to write certain values back to the underlying observables if they don't meet some criteria. It ignored full name values that didn't include a space.

Taking this a step further, you could also toggle an `isValid` flag depending on whether the latest input was satisfactory, and display a message in the UI accordingly. There's an easier way of doing validation (explained below), but first consider the following view model, which demonstrates the mechanism:

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

... with the following DOM elements:

    <p>Enter a numeric value: <input data-bind="value: attemptedValue"/></p>
    <div data-bind="visible: !lastInputWasValid()">That's not a number!</div>

Now, `acceptedNumericValue` will only ever contain numeric values, and any other values entered will trigger the appearance of a validation message instead of updating `acceptedNumericValue`.

**Note:** For such trivial requirements as validating that an input is numeric, this technique is overkill. It would be far easier just to use jQuery Validation and its `number` class on the `<input>` element. Knockout and jQuery Validation work together nicely, as demonstrated on the [grid editor](../examples/gridEditor.html) example. However, the preceding example demonstrates a more general mechanism for filtering and validating with custom logic to control what kind of user feedback appears, which may be of use if your scenario is more complex than jQuery Validation handles natively.

# How dependency tracking works

*Beginners don't need to know about this, but more advanced developers will want to know why we keep making all these claims about KO automatically tracking dependencies and updating the right parts of the UI...*

It's actually very simple and rather lovely. The tracking algorithm goes like this:

1. Whenever you declare a computed observable, KO immediately invokes its evaluator function to get its initial value.
1. While your evaluator function is running, KO keeps a log of any observables (or computed observables) that your evaluator reads the value of.
1. When your evaluator is finished, KO sets up subscriptions to each of the observables (or computed observables) that you've touched. The subscription callback is set to cause your evaluator to run again, looping the whole process back to step 1 (disposing of any old subscriptions that no longer apply).
1. KO notifies any subscribers about the new value of your computed observable.

So, KO doesn't just detect your dependencies the first time your evaluator runs - it redetects them every time. This means, for example, that your dependencies can vary dynamically: dependency A could determine whether you also depend on B or C. Then, you'll only be re-evaluated when either A or your current choice of B or C changes.  You don't have to declare dependencies: they're inferred at runtime from the code's execution.

The other neat trick is that declarative bindings are simply implemented as computed observables. So, if a binding reads the value of an observable, that binding becomes dependent on that observable, which causes that binding to be re-evaluated if the observable changes.

### Controlling dependencies using peek

Knockout's automatic dependency tracking normally does exactly what you want. But you might sometimes need to control which observables will update your computed observable, especially if the computed observable performs some sort of action, such as making an Ajax request. The `peek` function lets you access an observable or computed observable without creating a dependency.

In the example below, a computed observable is used to reload an observable named `currentPageData` using Ajax with data from two other observable properties. The computed observable will update whenever `pageIndex` changes, but it ignores changes to `selectedItem` because it is accessed using `peek`. In this case, the user might want to use the current value of `selectedItem` only for tracking purposes when a new set of data is loaded.

    ko.computed(function() {
        var params = {
            page: this.pageIndex(),
            selected: this.selectedItem.peek()
        };
        $.getJSON('/Some/Json/Service', params, this.currentPageData);
    }, this);

Note: If you just want to prevent a computed observable from updating too often, see the [`rateLimit` extender](rateLimit-observable.html).

### Note: Why circular dependencies aren't meaningful

Computed observables are supposed to map a set of observable inputs into a single observable output. As such, it doesn't make sense to include cycles in your dependency chains. Cycles would *not* be analogous to recursion; they would be analogous to having two spreadsheet cells that are computed as functions of each other. It would lead to an infinite evaluation loop.

So what does Knockout do if you have a cycle in your dependency graph? It avoids infinite loops by enforcing the following rule: **Knockout will not restart evaluation of a computed while it is already evaluating**. This is very unlikely to affect your code. It's relevant in two situations: when two computed observables are dependent on each other (possible only if one or both use the `deferEvaluation` option), or when a computed observable writes to another observable on which it has a dependency (either directly or via a dependency chain). If you need to use one of these patterns and want to entirely avoid the circular dependency, you can use the `peek` function described above.

# Determining if a property is a computed observable

In some scenarios, it is useful to programmatically determine if you are dealing with a computed observable. Knockout provides a utility function, `ko.isComputed` to help with this situation. For example, you might want to exclude computed observables from data that you are sending back to the server.

    for (var prop in myObject) {
      if (myObject.hasOwnProperty(prop) && !ko.isComputed(myObject[prop])) {
          result[prop] = myObject[prop];
      }
    }

Additionally, Knockout provides similar functions that can operate on observables and computed observables:

* `ko.isObservable` - returns true for observables, observable arrays, and all computed observables.
* `ko.isWriteableObservable` - returns true for observable, observable arrays, and writeable computed observables.

# Computed Observable Reference

The following documentation describes how to construct and work with computed observables.

## Constructing a computed observable

A computed observable can be constructed using one of the following forms:

1. `ko.computed( evaluator [, targetObject, options] )` --- This form supports the most common case of creating a computed observable.
  * `evaluator` --- A function that is used to evaluate the computed observable's current value.
  * `targetObject` --- If given, defines the value of `this` whenever KO invokes your callback functions. See the section on [managing `this`](#managing_this) for more information.
  * `options` --- An object with further properties for the computed observable. See the full list below.

1. `ko.computed( options )` --- This single parameter form for creating a computed observable accepts a JavaScript object with any of the following properties.
  * `read` --- Required. A function that is used to evaluate the computed observable's current value.
  * `write` --- Optional. If given, makes the computed observable writeable. This is a function that receives values that other code is trying to write to your computed observable. It's up to you to supply custom logic to handle the incoming values, typically by writing the values to some underlying observable(s).
  * `owner` --- Optional. If given, defines the value of `this` whenever KO invokes your `read` or `write` callbacks.
  * `deferEvaluation` --- Optional. If this option is true, then the value of the computed observable will not be evaluated until something actually attempts to access its value or manually subscribes to it. By default, a computed observable has its value determined immediately during creation.
  * `disposeWhen` --- Optional. If given, this function is executed on each re-evaluation to determine if the computed observable should be disposed. A `true`-ish result will trigger disposal of the computed observable.
  * `disposeWhenNodeIsRemoved` --- Optional. If given, disposal of the computed observable will be triggered when the specified DOM node is removed by KO. This feature is used to dispose computed observables used in bindings when nodes are removed by the `template` and control-flow bindings.

## Using a computed observable

A computed observable provides the following functions:

* `dispose()` --- Manually disposes the computed observable, clearing all subscriptions to dependencies. This function is useful if you want to stop a computed observable from being updated or want to clean up memory for a computed observable that has dependencies on observables that won't be cleaned.
* `extend(extenders)` --- Applies the given [extenders](extenders.html) to the computed observable.
* `getDependenciesCount()` --- Returns the current number of dependencies of the computed observable.
* `getSubscriptionsCount()` --- Returns the current number of subscriptions (either from other computed observables or manual subscriptions) of the computed observable.
* `isActive()` --- Returns whether the computed observable may be updated in the future. A computed observable is inactive if it has no dependencies.
* `peek()` --- Returns the current value of the computed observable without creating a dependency (see the section above on [`peek`](#controlling_dependencies_using_peek)).
* `subscribe( callback [,callbackTarget, event] )` --- Registers a [manual subscription](observables.html#explicitly_subscribing_to_observables) to be notified of changes to the computed observable.

## Using the computed context

During the execution of a computed observable's evaluator function, you can access `ko.computedContext` to get information about the current computed property. It provides the following functions:

* `isInitial()` --- A function that returns `true` if called during the first ever evaluation of the current computed observable, or `false` otherwise.

* `getDependenciesCount()` --- Returns the number of dependencies of the computed observable detected so far during the current evaluation.
  * Note: `ko.computedContext.getDependenciesCount()` is equivalent to calling `getDependenciesCount()` on the computed observable itself. The reason that it also exists on `ko.computedContext` is to provide a way of counting the dependencies during the first ever evaluation, before the computed observable has even finished being constructed.

Example:

    var myComputed = ko.computed(function() {
        // ... Omitted: read some data that might be observable ...

        // Now let's inspect ko.computedContext
        var isFirstEvaluation = ko.computedContext.isInitial(),
            dependencyCount = ko.computedContext.getDependenciesCount(),
        console.log("Evaluating " + (isFirstEvaluation ? "for the first time" : "again"));
        console.log("By now, this computed has " + dependencyCount + " dependencies");

        // ... Omitted: return the result ...
    });

These facilities are typically useful only in advanced scenarios, for example when your computed observable's primary purpose is to trigger some side-effect during its evaluator, and you want to perform some setup logic only during the first run, or only if it has at least one dependency (and hence might re-evaluate in the future). Most computed properties do not need to care whether they have been evaluated before, or how many dependencies they have.