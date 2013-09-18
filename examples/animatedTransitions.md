---
layout: example
title: Animated transitions example
---

This example shows two ways to animate transitions:

 * When using the `template/foreach` binding, you can provide `afterAdd` and `beforeRemove` callbacks. These let you intercept the code that actually adds or removes elements, so you can trivially use something like jQuery's `slideUp`/`slideDown()` animation methods or similar. To see this in action, switch between different planet types, or add new planets.
 
 * It's not hard to write a custom Knockout binding that manipulates element states in arbitrary ways according to the value of an observable. Check the HTML source code to see a custom binding called `fadeVisible` that, whenever an observable value changes, uses jQuery's `fadeIn`/`fadeOut` functions to animate the associated DOM element. To see this in action, check and uncheck the "advanced options" checkbox.

<style type="text/css">
    .planet { background-color: #AAEECC; padding: 0.25em; border: 1px solid silver; margin-bottom: 0.5em; font-size: 0.75em; }
    .planet.rock { background-color: #EECCAA; }
    .liveExample input { margin: 0 0.3em 0 1em; }
</style>

{% capture live_example_view %}   
<h2>Planets</h2>
<p> 
    <label>
        <input type='checkbox' data-bind='checked: displayAdvancedOptions' />
        Display advanced options
    </label>
</p>

<p data-bind='fadeVisible: displayAdvancedOptions'>
    Show:
    <label><input type='radio' name="type" value='all' data-bind='checked: typeToShow' />All</label>
    <label><input type='radio' name="type" value='rock' data-bind='checked: typeToShow' />Rocky planets</label>
    <label><input type='radio' name="type" value='gasgiant' data-bind='checked: typeToShow' />Gas giants</label>
</p>

<div data-bind='template: { foreach: planetsToShow,
                            beforeRemove: hidePlanetElement,
                            afterAdd: showPlanetElement }'>
    <div data-bind='attr: { "class": "planet " + type }, text: name'> </div>
</div>

<p data-bind='fadeVisible: displayAdvancedOptions'>
    <button data-bind='click: addPlanet.bind($data, "rock")'>Add rocky planet</button>
    <button data-bind='click: addPlanet.bind($data, "gasgiant")'>Add gas giant</button>
</p>
{% endcapture %}

{% capture live_example_viewmodel %}
    var PlanetsModel = function() {
        this.planets = ko.observableArray([
            { name: "Mercury", type: "rock"},
            { name: "Venus", type: "rock"},
            { name: "Earth", type: "rock"},
            { name: "Mars", type: "rock"},
            { name: "Jupiter", type: "gasgiant"},
            { name: "Saturn", type: "gasgiant"},
            { name: "Uranus", type: "gasgiant"},
            { name: "Neptune", type: "gasgiant"},
            { name: "Pluto", type: "rock"}
        ]);

        this.typeToShow = ko.observable("all");
        this.displayAdvancedOptions = ko.observable(false);

        this.addPlanet = function(type) {
            this.planets.push({
                name: "New planet",
                type: type
            });
        };

        this.planetsToShow = ko.computed(function() {
            // Represents a filtered list of planets
            // i.e., only those matching the "typeToShow" condition
            var desiredType = this.typeToShow();
            if (desiredType == "all") return this.planets();
            return ko.utils.arrayFilter(this.planets(), function(planet) {
                return planet.type == desiredType;
            });
        }, this);

        // Animation callbacks for the planets list
        this.showPlanetElement = function(elem) { if (elem.nodeType === 1) $(elem).hide().slideDown() }
        this.hidePlanetElement = function(elem) { if (elem.nodeType === 1) $(elem).slideUp(function() { $(elem).remove(); }) }
    };

    // Here's a custom Knockout binding that makes elements shown/hidden via jQuery's fadeIn()/fadeOut() methods
    // Could be stored in a separate utility library
    ko.bindingHandlers.fadeVisible = {
        init: function(element, valueAccessor) {
            // Initially set the element to be instantly visible/hidden depending on the value
            var value = valueAccessor();
            $(element).toggle(ko.unwrap(value)); // Use "unwrapObservable" so we can handle values that may or may not be observable
        },
        update: function(element, valueAccessor) {
            // Whenever the value subsequently changes, slowly fade the element in or out
            var value = valueAccessor();
            ko.unwrap(value) ? $(element).fadeIn() : $(element).fadeOut();
        }
    };

    ko.applyBindings(new PlanetsModel());
{% endcapture %}
{% include live-example-tabs.html %}

[Try it in jsFiddle](http://jsfiddle.net/rniemeyer/8k8V5/)