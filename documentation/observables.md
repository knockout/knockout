---
layout: documentation
title: Observables
---

Knockout is built around three core features:

1. Observables and dependency tracking
1. Declarative bindings
1. Templating

On this page, you'll learn about the first of these three. But before that, let me explain the MVVM pattern and the concept of a *view model*.

# MVVM and View Models

*Model-View-View Model (MVVM)* is a design pattern for building user interfaces. It describes how you can keep a potentially sophisticated UI simple by splitting it into three parts:

* A *model*: your application's stored data. This data represents objects and operations in your business domain (e.g., bank accounts that can perform money transfers) and is independent of any UI. When using KO, you will usually make Ajax calls to some server-side code to read and write this stored model data.

* A *view model*: a pure-code representation of the data and operations on a UI. For example, if you're implementing a list editor, your view model would be an object holding a list of items, and exposing methods to add and remove items.

  Note that this is not the UI itself: it doesn't have any concept of buttons or display styles. It's not the persisted data model either - it holds the unsaved data the user is working with. When using KO, your view models are pure JavaScript objects that hold no knowledge of HTML. Keeping the view model abstract in this way lets it stay simple, so you can manage more sophisticated behaviors without getting lost.

* A *view*: a visible, interactive UI representing the state of the view model. It displays information from the view model, sends commands to the view model (e.g., when the user clicks buttons), and updates whenever the state of the view model changes. 

  When using KO, your view is simply your HTML document with declarative bindings to link it to the view model. Alternatively, you can use templates that generate HTML using data from your view model.
  
To create a view model with KO, just declare any JavaScript object. For example,

    var myViewModel = {
        personName: 'Bob',
        personAge: 123
    };

You can then create a very simple *view* of this view model using a declarative binding. For example, the following markup displays the `personName` value:

    The name is <span data-bind="text: personName"></span>

## Activating Knockout

The `data-bind` attribute isn't native to HTML, though it is perfectly OK (it's strictly compliant in HTML 5, and causes no problems with HTML 4 even though a validator will point out that it's an unrecognized attribute). But since the browser doesn't know what it means, you need to activate Knockout to make it take effect.

To activate Knockout, add the following line to a `<script>` block:
	
	ko.applyBindings(myViewModel);
	
You can either put the script block at the bottom of your HTML document, or you can put it at the top and wrap the contents in a DOM-ready handler such as [jQuery's `$` function](http://api.jquery.com/jQuery/#jQuery3).

That does it! Now, your view will display as if you'd written the following HTML:

    The name is <span>Bob</span>

In case you're wondering what the parameters to `ko.applyBindings` do,

* The first parameter says what view model object you want to use with the declarative bindings it activates

* Optionally, you can pass a second parameter to define which part of the document you want to search for `data-bind` attributes. For example, `ko.applyBindings(myViewModel, document.getElementById('someElementId'))`. This restricts the activation to the element with ID `someElementId` and its descendants, which is useful if you want to have multiple view models and associate each with a different region of the page.

Pretty simple, really.

**Important** - this documentation refers to Knockout version 1.1.0pre. If you're using an older version of Knockout, e.g., 1.0.5, you need to pass parameters to `ko.applyBindings` in the opposite order, e.g., `ko.applyBindings(document.body, myViewModel)`.

# Observables

OK, you've seen how to create a basic view model and how to display one of its properties using a binding. But one of the key benefits of KO is that it updates your UI automatically when the view model changes. How can KO know when parts of your view model change? Answer: you need to declare your model properties as *observables*, because these are special JavaScript objects that can notify subscribers about changes, and can automatically detect dependencies.

For example, rewrite the preceding view model object as follows:

    var myViewModel = {
        personName: ko.observable('Bob'),
        personAge: ko.observable(123)
    };
    
You don't have to change the view at all - the same `data-bind` syntax will keep working. The difference is that it's now capable of detecting changes, and when it does, it will update the view automatically.

## Reading and writing observables

Not all browsers support JavaScript getters and setters (\* cough \* IE \* cough \*), so for compatibility, `ko.observable` objects are actually *functions*. 

* To **read** the observable's current value, just call the observable with no parameters. In this example, `myViewModel.personName()` will return `'Bob'`, and `myViewModel.personAge()` will return `123`.

* To **write** a new value to the observable, call the observable and pass the new value as a parameter. For example, calling `myViewModel.personName('Mary')` will change the name value to `'Mary'`.

* To write values to **multiple observable properties** on a model object, you can use *chaining syntax*. For example, `myViewModel.personName('Mary').personAge(50)` will change the name value to `'Mary'` *and* the age value to `50`.

The whole point of observables is that they can be observed, i.e., other code can say that it wants to be notified of changes. That's what many of KO's built-in bindings do internally. So, when you wrote `data-bind="text: personName"`, the `text` binding registered itself to be notified when `personName` changes (assuming it's an observable value, which it is now). 

When you change the name value to `'Mary'` by calling `myViewModel.personName('Mary')`, the `text` binding will automatically update the text contents of the associated DOM element. That's how changes to the view model automatically propagate to the view.

## Explicitly subscribing to observables

*You won't normally need to set up subscriptions manually, so beginners should skip this section.*

For advanced users, if you want to register your own subscriptions to be notified of changes to observables, you can call their `subscribe` function. For example,

    myViewModel.personName.subscribe(function(newValue) {
    	alert("The person's new name is " + newValue);
	});

The `subscribe` function is how many parts of KO work internally. You can also terminate a subscription if you wish: first capture it as a variable, then you can call its `dispose` function, e.g.:

    var subscription = myViewModel.personName.subscribe(function(newValue) { /* do stuff */ });
    // ...then later...
    subscription.dispose(); // I no longer want notifications
    
Most of the time you don't need to do this, because the built-in bindings and templating system take care of managing subscriptions.

# Dependent Observables

What if you've got an observable for `firstName`, and another for `lastName`, and you want to display the full name? That's where *dependent observables* come in - these are functions of one or more other observables, and will automatically update whenever any of their dependencies change. 

For example, given the following view model,

    var viewModel = {
    	firstName: ko.observable('Bob'),
    	lastName: ko.observable('Smith')
    };
    
... you could add a dependent observable to return the full name:

    viewModel.fullName = ko.dependentObservable(function() {
    	return this.firstName() + " " + this.lastName();
    }, viewModel);
    
Now you could bind UI elements to it, e.g.:

    The name is <span data-bind="text: fullName"></span>
    
... and they will be updated whenever `firstName` or `lastName` changes (your evaluator function will be called once each time any of its dependencies change, and whatever value you return will be passed on to the observers such as UI elements or other dependent observables).

### Managing 'this'

*Beginners may wish to skip this section - as long as you follow the same coding patterns as the examples, you won't need to know or care about it!*

In case you're wondering what the second parameter to `ko.dependentObservable` is (the bit where I passed `viewModel` in the preceding code), that defines the value of `this` when evaluating the dependent observable. Without that, it would not have been possible to refer to `this.firstName()` or `this.lastName()`. Experienced JavaScript coders will regard this as obvious, but if you're unfamiliar with JavaScript it might seem strange. (Languages like C# and Java never expect the programmer to set a value for `this`, but JavaScript does, because its functions themselves aren't part of any object by default.)

Unfortunately, JavaScript object literals don't have any way of referring to themselves, so you must add dependent observables to view model objects by writing `myViewModelObject.myDependentObservable = ...`, and you can't just declare them inline. In other words, you *can't* write this:

    var viewModel = {
    	myDependentObservable: ko.dependentObservable(function() {
    	    ...
    	}, /* can't refer to viewModel from here, so this doesn't work */)
    }

... but instead must write this:

    var viewModel = {
    	// Add other properties here as you wish
    };
    viewModel.myDependentObservable = ko.dependentObservable(function() {
    	...
    }, viewModel); // This is OK
    
It's really not a problem as long as you know what to expect :)

### Dependency chains just work

Of course, you can create whole chains of dependent observables if you wish. For example, you might have:

* an **observable** called `items` representing a set of items
* another **observable** called `selectedIndexes` storing which item indexes have been 'selected' by the user
* a **dependent observable** called `selectedItems` that returns an array of item objects corresponding to the selected indexes
* another **dependent observable** that returns `true` or `false` depending on whether any of `selectedItems` has some property (like being new or being unsaved). Some UI element, like a button, might be enabled or disabled based on this value.

Then, changes to `items` or `selectedIndexes` will ripple through the chain of dependent observables, which in turn updates any UI bound to them. Very tidy and elegant.

# How dependency tracking works

*Beginners don't need to know about this, but more advanced developers will want to know why I keep making all these claims about KO automatically tracking dependencies and updating the right parts of the UI...*

It's actually very simple and rather lovely. The tracking algorithm goes like this:

1. Whenever you declare a dependent observable, KO immediately invokes its evaluator function to get its initial value.
1. While your evaluator function is running, KO keeps a log of any observables (or dependent observables) that your evaluator reads the value of.
1. When your evaluator is finished, KO sets up subscriptions to each of the observables (or dependent observables) that you've touched. The subscription callback is set to cause your evaluator to run again, looping the whole process back to step 1 (disposing of any old subscriptions that no longer apply).
1. KO notifies any subscribers about the new value of your dependent observable.

So, KO doesn't just detect your dependencies the first time your evaluator runs - it redetects them every time. This means, for example, that your dependencies can vary dynamically: dependency A could determine whether you also depend on B or C. Then, you'll only be re-evaluated when either A or your current choice of B or C changes.  You don't have to declare dependencies: they're inferred at runtime from the code's execution.

The other neat trick is that declarative bindings (which includes the output from templates) are simply implemented as dependent observables. So, if a template reads the value of an observable, that template binding becomes dependent on that observable, which causes that template binding to be re-evaluated if the observable changes. Nested templates work automatically: if template X renders template Y which reads the value of observable Z, then when Z changes, only Y directly touched it, so that's the only part of the screen that gets re-rendered. 