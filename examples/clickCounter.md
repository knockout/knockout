---
layout: example
title: Click counter example
---

This example demonstrates creating a view model class and applying various bindings to some HTML markup so that it reflects and edits the state of the view model.

Knockout tracks dependencies. Internally, `hasClickedTooManyTimes` has a subscription on `numberOfClicks`, so when `numberOfClicks` changes, that forces `hasClickedTooManyTimes` to be re-evaluated. Similarly, multiple parts of the UI reference `hasClickedTooManyTimes` and are therefore subscribed to it. Whenever `hasClickedTooManyTimes` changes, this causes the UI to be updated.

You don't have to define or manage these subscriptions manually. They are created and destroyed as needed by the framework. Check the HTML source code to see how simple this is.

{% capture live_example_view %}
<div>You've clicked <span data-bind='text: numberOfClicks'>&nbsp;</span> times</div>

<button data-bind='click: registerClick, disable: hasClickedTooManyTimes'>Click me</button>

<div data-bind='visible: hasClickedTooManyTimes'>
    That's too many clicks! Please stop before you wear out your fingers.
    <button data-bind='click: resetClicks'>Reset clicks</button>
</div>
{% endcapture %}

{% capture live_example_viewmodel %}
    var ClickCounterViewModel = function() {
        this.numberOfClicks = ko.observable(0);

        this.registerClick = function() {
            this.numberOfClicks(this.numberOfClicks() + 1);
        };

        this.resetClicks = function() {
            this.numberOfClicks(0);
        };

        this.hasClickedTooManyTimes = ko.computed(function() {
            return this.numberOfClicks() >= 3;
        }, this);
    };

    ko.applyBindings(new ClickCounterViewModel());
{% endcapture %}

{% include live-example-tabs.html %}

[Try it in jsFiddle](http://jsfiddle.net/rniemeyer/3Lqsx/)