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
    
### Dependency chains just work

Of course, you can create whole chains of computed observables if you wish. For example, you might have:

* an **observable** called `items` representing a set of items
* another **observable** called `selectedIndexes` storing which item indexes have been 'selected' by the user
* a **computed observable** called `selectedItems` that returns an array of item objects corresponding to the selected indexes
* another **computed observable** that returns `true` or `false` depending on whether any of `selectedItems` has some property (like being new or being unsaved). Some UI element, like a button, might be enabled or disabled based on this value.

Changes to `items` or `selectedIndexes` will ripple through the chain of computed observables, which in turn will update any UI elements bound to them.

### Managing 'this'

The second parameter to `ko.computed` (the bit where we passed `this` in the above example) defines the value of `this` when evaluating the computed observable. Without passing it in, it would not have been possible to refer to `this.firstName()` or `this.lastName()`. Experienced JavaScript coders will regard this as obvious, but if you're still getting to know JavaScript it might seem strange. (Languages like C# and Java never expect the programmer to set a value for `this`, but JavaScript does, because its functions themselves aren't part of any object by default.)

#### A popular convention that simplifies things

There's a popular convention that avoids the need to track `this` altogether: if your viewmodel's constructor copies a reference to `this` into a different variable (traditionally called `self`), you can then use `self` throughout your viewmodel and don't have to worry about it being redefined to refer to something else. For example:

    function AppViewModel() {
        var self = this;

        self.firstName = ko.observable('Bob');
        self.lastName = ko.observable('Smith');
        self.fullName = ko.computed(function() {
            return self.firstName() + " " + self.lastName();
        });
    }

Because `self` is captured in the function's closure, it remains available and consistent in any nested functions, such as the computed observable's evaluator. This convention is even more useful when it comes to event handlers, as you'll see in many of the [live examples](../examples/).

### *Pure* computed observables

If your computed observable simply calculates and returns a value based on some observable dependencies, then it's better to declare it as a `ko.pureComputed` instead of a `ko.computed`. For example:

    this.fullName = ko.pureComputed(function() {
        return this.firstName() + " " + this.lastName();
    }, this);

Since this computed is declared to be *pure* (i.e., its evaluator does not directly modify other objects or state), Knockout can more efficiently manage its re-evaluation and memory use. Knockout will automatically suspend or release it if no other code has an active dependency on it.

Pure computeds were introduced in Knockout 3.2.0. See also: [more about pure computed observables](computed-pure.html).

### Forcing computed observables to always notify subscribers

When a computed observable returns a primitive value (a number, string, boolean, or null), the dependencies of the observable are normally only notified if the value actually changed. However, it is possible to use the built-in `notify` [extender](extenders.html) to ensure that a computed observable's subscribers are always notified on an update, even if the value is the same. You would apply the extender like this:

    myViewModel.fullName = ko.pureComputed(function() {
        return myViewModel.firstName() + " " + myViewModel.lastName();
    }).extend({ notify: 'always' });

### Delaying and/or suppressing change notifications

Normally, a computed observable updates and notifies its subscribers immediately, as soon as its dependencies change. But if a computed observable has many dependencies or involves expensive updates, you may get better performance by limiting or delaying the computed observable's updates and notifications. This is accomplished using the [`rateLimit` extender](rateLimit-observable.html) like this:

    // Ensure updates no more than once per 50-millisecond period
    myViewModel.fullName.extend({ rateLimit: 50 });
    
### Determining if a property is a computed observable

In some scenarios, it is useful to programmatically determine if you are dealing with a computed observable. Knockout provides a utility function, `ko.isComputed` to help with this situation. For example, you might want to exclude computed observables from data that you are sending back to the server.

    for (var prop in myObject) {
      if (myObject.hasOwnProperty(prop) && !ko.isComputed(myObject[prop])) {
          result[prop] = myObject[prop];
      }
    }

Additionally, Knockout provides similar functions that can operate on observables and computed observables:

* `ko.isObservable` - returns true for observables, observable arrays, and all computed observables.
* `ko.isWritableObservable` - returns true for observables, observable arrays, and writable computed observables (also aliased as `ko.isWriteableObservable`).

