---
layout: documentation
title: Loading and Saving JSON data
---

Knockout allows you to implement sophisticated client-side interactivity, but almost all web applications also need to exchange data with the server, or at least to serialize the data for local storage. The most convenient way to exchange or store data is in [JSON format](http://json.org/) - the format that the majority of Ajax applications use today.

### Loading or Saving Data

Knockout doesn't force you to use any one particular technique to load or save data. You can use whatever mechanism is a convenient fit for your chosen server-side technology. The most commonly-used mechanism is jQuery's Ajax helper methods, such as [`getJSON`](http://api.jquery.com/jQuery.getJSON/), [`post`](http://api.jquery.com/jQuery.post/), and [`ajax`](http://api.jquery.com/jQuery.ajax/). You can fetch data from the server:

    $.getJSON("/some/url", function(data) { 
    	// Now use this data to update your view models, 
    	// and Knockout will update your UI automatically 
    })

... or you can send data to the server:

	var data = /* Your data in JSON format - see below */;
	$.post("/some/url", data, function(returnedData) {
		// This callback is executed if the post was successful		
	})

Or, if you don't want to use jQuery, you can use any other mechanism for loading or saving JSON data. So, all Knockout needs to help you do is:

 * For saving, get your view model data into a simple JSON format so you can send it using one of the above techniques
 * For loading, update your view model using data that you've received using one of the above techniques

### Converting View Model Data to Plain JSON

Your view models *are* JavaScript objects, so in a sense, you could just serialize them as JSON using any standard JSON serializer, such as [JSON.stringify](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/JSON/stringify) (a native function in modern browsers), or the [`json2.js`](https://github.com/douglascrockford/JSON-js/blob/master/json2.js) library. However, your view models probably contain observables, computed observables, and observable arrays, which are implemented as JavaScript functions and therefore won't always serialize cleanly without additional work on your behalf.

To make it easy to serialize view model data, including observables and the like, Knockout includes two helper functions:

 * `ko.toJS` --- this clones your view model's object graph, substituting for each observable the current value of that observable, so you get a plain copy that contains only your data and no Knockout-related artifacts
 * `ko.toJSON` --- this produces a JSON string representing your view model's data. Internally, it simply calls `ko.toJS` on your view model, and then uses the browser's native JSON serializer on the result. Note: for this to work on older browsers that have no native JSON serializer (e.g., IE 7 or earlier), you must also reference the [`json2.js`](https://github.com/douglascrockford/JSON-js/blob/master/json2.js) library.
 
For example, define a view model as follows:

    var viewModel = {
        firstName : ko.observable("Bert"),
        lastName : ko.observable("Smith"),
        pets : ko.observableArray(["Cat", "Dog", "Fish"]),
        type : "Customer"
    };
    viewModel.hasALotOfPets = ko.computed(function() {
        return this.pets().length > 2
    }, viewModel)
    
This contains a mix of observables, computed observables, observable arrays, and plain values. You can convert it to a JSON string suitable for sending to the server using `ko.toJSON` as follows:

    var jsonData = ko.toJSON(viewModel);
    
    // Result: jsonData is now a string equal to the following value
    // '{"firstName":"Bert","lastName":"Smith","pets":["Cat","Dog","Fish"],"type":"Customer","hasALotOfPets":true}'

Or, if you just want the plain JavaScript object graph *before* serialization, use `ko.toJS` as follows:

    var plainJs = ko.toJS(viewModel);
    
    // Result: plainJS is now a plain JavaScript object in which nothing is observable. It's just data.
    // The object is equivalent to the following:
    //   {
    //      firstName: "Bert",
    //      lastName: "Smith",
    //      pets: ["Cat","Dog","Fish"],
    //      type: "Customer",
    //      hasALotOfPets: true
    //   }

Note that `ko.toJSON` accepts the same arguments as [JSON.stringify](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/JSON/stringify). For example, it can be useful to have a "live" representation of your view model data when debugging a Knockout application. To generate a nicely formatted display for this purpose, you can pass the *spaces* argument into `ko.toJSON` and bind against your view model like:

    <pre data-bind="text: ko.toJSON($root, null, 2)"></pre>


### Updating View Model Data using JSON 

If you've loaded some data from the server and want to use it to update your view model, the most straightforward way is to do it yourself. For example,

    // Load and parse the JSON
    var someJSON = /* Omitted: fetch it from the server however you want */;
    var parsed = JSON.parse(someJSON);

    // Update view model properties
    viewModel.firstName(parsed.firstName);
    viewModel.pets(parsed.pets);
    
In many scenarios, this direct approach is the simplest and most flexible solution. Of course, as you update the properties on your view model, Knockout will take care of updating the visible UI to match it.

However, many developers prefer to use a more conventions-based approach to updating their view models using incoming data without manually writing a line of code for every property to be updated. This can be beneficial if your view models have many properties, or deeply nested data structures, because it can greatly reduce the amount of manual mapping code you need to write. For more details about this technique, see [the knockout.mapping plugin](plugins-mapping.html).