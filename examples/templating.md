---
layout: example
title: Templating example
---

This example shows how to render a template, including how to use data binding attributes on the elements it renders.

Templates may easily be nested. Knockout will automatically re-render a template when any data it depends on changes. As you can see from this demonstration (enable 'Show render times'), Knockout knows that it only needs to re-render the innermost templates for which the data has changed.

<style type="text/css">
    .renderTime { color: #777; font-style: italic; font-size: 0.8em; }
</style>
        
{% capture live_example_view %} 
<div data-bind='template: "peopleTemplate"'> </div>
<label><input type="checkbox" data-bind="checked: showRenderTimes" /> Show render times</label>

<script type="text/html" id="peopleTemplate">
    <h2>People</h2>
    <ul>
        {{'{{'}}each people}}
            <li>
                <div>
                    ${ name } has <span data-bind="text: children().length">&nbsp;</span> children:
                    <a href="#" data-bind="click: addChild ">Add child</a>
                    <span class="renderTime" data-bind="visible: showRenderTimes">
                        (person rendered at <span data-bind="text: new Date().getSeconds()"></span>)
                    </span>
                </div>
                <div data-bind='template: { name: "childrenTemplate", data: children }'></div>
            </li>
        {{'{{'}}/each}}
    </ul>
</script>
<script type="text/html" id="childrenTemplate">
    <ul>
        {{'{{'}}each $data}}
            <li>
                ${ this }
                <span class="renderTime" data-bind="visible: viewModel.showRenderTimes">
                    (child rendered at <span data-bind="text: new Date().getSeconds()"></span>)
                </span>
            </li>
        {{'{{'}}/each}}
    </ul>
</script>

{% endcapture %}

{% capture live_example_viewmodel %}
    // Define a "person" class that tracks its own name and children, and has a method to add a new child
    var person = function (name, children) {
        this.name = name;
        this.children = ko.observableArray(children);				
        
        this.addChild = function () {
            this.children.push("New child");
        }.bind(this);
    }

    // The view model is an abstract description of the state of the UI, but without any knowledge of the UI technology (HTML)
    var viewModel = {
        people : [
            new person("Annabelle", ["Arnie", "Anders", "Apple"]),
            new person("Bertie", ["Boutros-Boutros", "Brianna", "Barbie", "Bee-bop"]),
            new person("Charles", ["Cayenne", "Cleopatra"])
        ],
        showRenderTimes : ko.observable(false)
    };

    ko.applyBindings(viewModel);
{% endcapture %}
{% include live-example-tabs.html %}