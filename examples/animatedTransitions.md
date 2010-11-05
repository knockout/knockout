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
		<input type="checkbox" data-bind="checked: displayAdvancedOptions" />
		Display advanced options
	</label>	
</p>

<p data-bind="fadeVisible: displayAdvancedOptions">
    Show: 
    <label><input type="radio" value="all" data-bind="checked: typeToShow" />All</label>
    <label><input type="radio" value="rock" data-bind="checked: typeToShow" />Rocky planets</label>
    <label><input type="radio" value="gasgiant" data-bind="checked: typeToShow" />Gas giants</label>
</p>

<div data-bind='template: { name: "planetsTemplate", 
                            foreach: planetsToShow, 
                            beforeRemove: function(elem) { $(elem).slideUp() },
                            afterAdd: function(elem) { $(elem).hide().slideDown() } }'> </div>

<script type="text/html" id="planetsTemplate">
    <div class="planet ${ type }">${ name }</div>
</script>

<p data-bind="fadeVisible: displayAdvancedOptions">
    <button data-bind='click: function() { addPlanet("rock") }'>Add rocky planet</button>
    <button data-bind='click: function() { addPlanet("gasgiant") }'>Add gas giant</button>
</p>
{% endcapture %}

{% capture live_example_viewmodel %}
    var viewModel = {
        planets: ko.observableArray([
            { name: "Mercury", type: "rock" },
            { name: "Venus", type: "rock" },
            { name: "Earth", type: "rock" },
            { name: "Mars", type: "rock" },
            { name: "Jupiter", type: "gasgiant" },
            { name: "Saturn", type: "gasgiant" },
            { name: "Uranus", type: "gasgiant" },
            { name: "Neptune", type: "gasgiant" },
            { name: "Pluto", type: "rock" }
        ]),
        typeToShow: ko.observable("all"),
        displayAdvancedOptions: ko.observable(false),

        addPlanet: function (type) { this.planets.push({ name: "New planet", type: type }); }
    };

    viewModel.planetsToShow = ko.dependentObservable(function () {    	
        // Represents a filtered list of planets
        // i.e., only those matching the "typeToShow" condition
        var desiredType = this.typeToShow();
        if (desiredType == "all")
        	return this.planets();
        return ko.utils.arrayFilter(this.planets(), function(planet) {
        	return planet.type == desiredType;
        });
    }.bind(viewModel));

    // Here's a custom Knockout binding that makes elements shown/hidden via jQuery's fadeIn()/fadeOut() methods
    // Could be stored in a separate utility library
    ko.bindingHandlers.fadeVisible = {
        init: function (element, valueAccessor) {
            // Initially set the element to be instantly visible/hidden depending on the value
            var value = valueAccessor();
            $(element).toggle(ko.utils.unwrapObservable(value)); // Use "unwrapObservable" so we can handle values that may or may not be observable
        },
        update: function (element, valueAccessor) {
            // Whenever the value subsequently changes, slowly fade the element in or out
            var value = valueAccessor();
            ko.utils.unwrapObservable(value) ? $(element).fadeIn() : $(element).fadeOut();
        }
    };

    ko.applyBindings(viewModel);
{% endcapture %}
{% include live-example-tabs.html %}