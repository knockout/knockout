---
layout: example
title: Hello World example
---

In this example, the two text boxes are bound to <em>observable</em> variables on a data model. The "full name" display is bound to a <em>dependent observable</em>, whose value is computed in terms of the observables.

Edit either text box to see the "full name" display update. See the HTML source code and notice there's no need to catch "onchange" events. Knockout knows when to update the UI.

{% capture live_example_view %}
<p>First name: <input data-bind="value: firstName" /></p>
<p>Last name: <input data-bind="value: lastName" /></p>
<h2>Hello, <span data-bind="text: fullName"> </span>!</h2>
{% endcapture %}

{% capture live_example_viewmodel %}
    // Here's my data model
    var viewModel = { 
    	firstName : ko.observable("Planet"),
    	lastName : ko.observable("Earth")
    };
    viewModel.fullName = ko.dependentObservable(function () {
    	// Knockout tracks dependencies automatically. It knows that fullName depends on firstName and lastName, because these get called when evaluating fullName.
        return viewModel.firstName() + " " + viewModel.lastName(); 
    });

    ko.applyBindings(viewModel); // This makes Knockout get to work
{% endcapture %}

{% include live-example-tabs.html %}