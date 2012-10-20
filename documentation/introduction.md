---
layout: documentation
title: Introduction
---

Knockout is a JavaScript library that helps you to create rich, responsive display and editor user interfaces with a clean underlying data model. Any time you have sections of UI that update dynamically (e.g., changing depending on the user's actions or when an external data source changes), KO can help you implement it more simply and maintainably.

Headline features:

* **Elegant dependency tracking** - automatically updates the right parts of your UI whenever your data model changes.
* **Declarative bindings** - a simple and obvious way to connect parts of your UI to your data model. You can construct a complex dynamic UIs easily using arbitrarily nested binding contexts.
* **Trivially extensible** - implement custom behaviors as new declarative bindings for easy reuse in just a few lines of code.

Additional benefits:

* **Pure JavaScript library** - works with any server or client-side technology
* **Can be added on top of your existing web application** without requiring major architectural changes
* **Compact** - around 13kb after gzipping
* **Works on any mainstream browser** (IE 6+, Firefox 2+, Chrome, Safari, others)
* **Comprehensive suite of specifications** (developed BDD-style) means its correct functioning can easily be verified on new browsers and platforms

Developers familiar with Ruby on Rails, ASP.NET MVC, or other MV* technologies may see MVVM as a real-time form of MVC with declarative syntax. In another sense, you can think of KO as a general way to make UIs for editing JSON data... whatever works for you :)

## OK, how do you use it?

The quickest and most fun way to get started is by working through the [interactive tutorials](http://learn.knockoutjs.com). Once you've got to grips with the basics, explore the [live examples](../examples/index.html) and then have a go with it in your own project.

## Is KO intended to compete with jQuery (or Prototype, etc.) or work with it?

Everyone loves jQuery! It's an outstanding replacement for the clunky, inconsistent DOM API we had to put up with in the past. jQuery is an excellent low-level way to manipulate elements and event handlers in a web page. KO solves a different problem.

As soon as your UI gets nontrivial and has a few overlapping behaviors, things can get tricky and expensive to maintain if you only use jQuery. Consider an example: you're displaying a list of items, stating the number of items in that list, and want to enable an 'Add' button only when there are fewer than 5 items. jQuery doesn't have a concept of an underlying data model, so to get the number of items you have to infer it from the number of TRs in a table or the number of DIVs with a certain CSS class. Maybe the number of items is displayed in some SPAN, and you have to remember to update that SPAN's text when the user adds an item. You also must remember to disable the 'Add' button when the number of TRs is 5. Later, you're asked also to implement a 'Delete' button and you have to figure out which DOM elements to change whenever it's clicked.

### How is Knockout different?
It's much easier with KO. It lets you scale up in complexity without fear of introducing inconsistencies. Just represent your items as a JavaScript array, and then use a `foreach` binding to transform this array into a TABLE or set of DIVs. Whenever the array changes, the UI changes to match (you don't have to figure out how to inject new TRs or where to inject them). The rest of the UI stays in sync. For example, you can declaratively bind a SPAN to display the number of items as follows:

    There are <span data-bind="text: myItems().count"></span> items

That's it! You don't have to write code to update it; it updates on its own when the `myItems` array changes. Similarly, to make the 'Add' button enable or disable depending on the number of items, just write:

    <button data-bind="enable: myItems().count < 5">Add</button>

Later, when you're asked to implement the 'Delete' functionality, you don't have to figure out what bits of the UI it has to interact with; you just make it alter the underlying data model.

To summarise: KO doesn't compete with jQuery or similar low-level DOM APIs. KO provides a complementary, high-level way to link a data model to a UI. KO itself doesn't depend on jQuery, but you can certainly use jQuery at the same time, and indeed that's often useful if you want things like animated transitions.