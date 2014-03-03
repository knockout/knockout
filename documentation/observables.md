---
layout: documentation
title: Observables
---

Knockout is built around three core features:

1. Observables and dependency tracking
1. Declarative bindings
1. Templating

On this page, you'll learn about the first of these three. But before that, let's examine the MVVM pattern and the concept of a *view model*.

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

For advanced users, if you want to register your own subscriptions to be notified of changes to observables, you can call their `subscribe` function. For example:

    myViewModel.personName.subscribe(function(newValue) {
        alert("The person's new name is " + newValue);
    });

The `subscribe` function is how many parts of KO work internally. Most of the time you don't need to use this, because the built-in bindings and templating system take care of managing subscriptions.

The `subscribe` function accepts three parameters: `callback` is the function that is called whenever the notification happens, `target` (optional) defines the value of `this` in the callback function, and `event` (optional; default is `"change"`) is the name of the event to receive notification for.

You can also terminate a subscription if you wish: first capture the return value as a variable, then you can call its `dispose` function, e.g.:

    var subscription = myViewModel.personName.subscribe(function(newValue) { /* do stuff */ });
    // ...then later...
    subscription.dispose(); // I no longer want notifications

If you want to be notified of the value of an observable before it is about to be changed, you can subscribe to the `beforeChange` event. For example:

    myViewModel.personName.subscribe(function(oldValue) {
        alert("The person's previous name is " + oldValue);
    }, null, "beforeChange");
    
Note: Knockout does not guarantee that the `beforeChange` and `change` events will occur in pairs, since other parts of your code might raise either event individually. If you need to track the previous value of an observable, it's up to you to use a subscription to capture and track it.

## Forcing observables to always notify subscribers

When writing to an observable that contains a primitive value (a number, string, boolean, or null), the dependencies of the observable are normally only notified if the value actually changed. However, it is possible to use the built-in `notify` [extender](extenders.html) to ensure that an observable's subscribers are always notified on a write, even if the value is the same. You would apply the extender to an observable like this:

    myViewModel.personName.extend({ notify: 'always' });

## Delaying and/or suppressing change notifications

Normally, an observable notifies its subscribers immediately, as soon as it's changed. But if an observable is changed repeatedly or triggers expensive updates, you may get better performance by limiting or delaying the observable's change notifications. This is accomplished using the [`rateLimit` extender](rateLimit-observable.html) like this:

    // Ensure it notifies about changes no more than once per 50-millisecond period
    myViewModel.personName.extend({ rateLimit: 50 });
