---
layout: documentation
title: Mapping
---

Knockout is designed to allow you to use arbitrary JavaScript objects as view models. As long as some of your view model's properties are [observables](observables.html), you can use KO to bind to them to your UI, and the UI will be updated automatically whenever the observable properties change. 

Most applications need to fetch data from a backend server. Since the server doesn't have any concept of observables, it will just supply a plain JavaScript object (usually serialized as JSON). The mapping plugin gives you a straightforward way to map that plain JavaScript object into a view model with the appropriate observables. This is an alternative to manually writing your own JavaScript code that constructs a view model based on some data you've fetched from the server.

{% capture plugin_download_link %}
 * __[Version 1.0](https://github.com/SteveSanderson/knockout.mapping/tree/master/build/output)__ (6.4kb minified)
{% endcapture %}
{% include plugin-download-link.html %}

### Example: Manual mapping without the ko.mapping plugin

You want to display the current server-time and the number of users on your web page. You could represent this information using the following view model:

	var viewModel = {
		serverTime: ko.observable(),
		numUsers: ko.observable()
	}

You could bind this view model to some HTML elements as follows:

	The time on the server is: <span data-bind='text: serverTime'></span>
	and <span data-bind='text: numUsers'></span> user(s) are connected.

Since the view model properties are observable, KO will automatically update the HTML elements whenever those properties change.

Next, you want to fetch the latest data from the server. Every 5 seconds you might issue an Ajax request (e.g., using jQuery's `$.getJSON` or `$.ajax` functions):

	var data = getDataUsingAjax();			// Gets the data from the server
	
The server might return JSON data similar to the following:

	{
		serverTime: '2010-01-07',
		numUsers: 3
	}
	
Finally, to update your view model using this data (without using the mapping plugin), you would write:

	// Every time data is received from the server:
	viewModel.serverTime(data.serverTime);
	viewModel.numUsers(data.numUsers);
	
You would have to do this for every variable you want to display on your page. If your data structures become more complex (e.g. they contain children or contain arrays) this becomes very cumbersome to handle manually. What the mapping plugin allows you to do is create a mapping from the regular JavaScript object (or JSON structure) to an observable view model.

### Example: Using ko.mapping

To create a view model via the mapping plugin, replace the creation of `viewModel` in the code above with the `ko.mapping.fromJS` function:

	var viewModel = ko.mapping.fromJS(data);
	
This automatically creates observable properties for each of the properties on `data`. Then, every time you receive new data from the server, you can update all the properties on `viewModel` in one step by using the `ko.mapping.updateFromJS` function:

	// Every time data is received from the server:
	ko.mapping.updateFromJS(viewModel, data);

### How things are mapped

 * All properties of an object are converted into an observable. If an update would change the value, it will update the observable.
 * Arrays are converted into [observable arrays](observableArrays.html). If an update would change the number of items, it will perform the appropriate add/remove actions. It will also try to keep the order the same as the original JavaScript array.
 
### Unmapping

If you want to convert your mapped object back to a regular JS object, use:

    var unmapped = ko.mapping.toJS(viewModel);

This will create an unmapped object containing only the properties of the mapped object that were part of your original JS object. So in other words, any properties or functions that you manually added to your view model are ignored. By default, the only exception to this rule is the `_destroy` property which will also be mapped back, because it is a property that Knockout may generate when you destroy an item from an `ko.observableArray`. See the "Advanced Usage" section for more details on how to configure this.

### Working with JSON strings

If your Ajax call returns a JSON string (and does not deserialize it into a JavaScript object), then you can use the functions `ko.mapping.fromJSON` and `ko.mapping.updateFromJSON` to create and update your view model instead. To unmap, you can use `ko.mapping.toJSON`.

Apart from the fact that they work with JSON strings instead of JS objects these functions are completely identical to their `*JS` counterparts.
 
### Advanced usage

Sometimes it may be necessary to have more control over how the mapping is performed. This is accomplished using *mapping options*. They can be specified during the `ko.mapping.fromJS` call. In subsequent `ko.mapping.updateFromJS` you don't need to specify them again.

Here a few situations in which you might want to use these mapping options.

###### Uniquely identifying objects using "keys"

Let's say you have a JavaScript object that looks like this:

	var data = {
		name: 'Scot',
		children: [
			{ id : 1, name : 'Alicw' }
		]
	}

You can map this to a view model without any problems:

	var viewModel = ko.mapping.fromJS(data);
	
Now, let's say the data is updated to be without any typos:

	var data = {
		name: 'Scott',
		children: [
			{ id : 1, name : 'Alice' }
		]
	}
	
Two things have happened here: `name` was changed from `Scot` to `Scott` and `children[0].name` was changed from `Alicw` to the typo-free `Alice`. You can update `viewModel` based on this new data:

	ko.mapping.updateFromJS(viewModel, data);

And `name` would have changed as expected. However, in the `children` array, the child (Alicw) would have been completely removed and a new one (Alice) added. This is not completely what you would have expected. Instead, you would have expected that only the `name` property of the child was updated from `Alicw` to `Alice`, not that the entire child was replaced!

This happens because, by default, the mapping plugin simply compares the two objects in the array. And since in JavaScript the object `{ id : 1, name : 'Alicw' }` does not equal `{ id : 1, name : 'Alice' }` it thinks that the *entire* child needs to be removed and replaced by a new one.

To solve this, you can specify which `key` the mapping plugin should use to determine if an object is new or old. You would set it up like this:

	var mapping = {
		'children': {
			key: function(data) {
				return ko.utils.unwrapObservable(data.id);
			}
		}
	}
	var viewModel = ko.mapping.fromJS(data, mapping);

This way, every time the mapping plugin checks an item in the `children` array, it will only look at the `id` property to determine if an object was completely replaced or merely needs updating.
	
###### Customizing object construction using "create"

If you want to handle a part of the mapping yourself, you can also provide a `create` callback. If this callback is present, the mapping plugin will allow you to do this part of the mapping yourself.

Let's say you have a JavaScript object that looks like this:

	var data = {
		name: 'Graham',
		children: [
			{ id : 1, name : 'Lisa' }
		]
	}

If you want to map the `children` array yourself, you can specify that like this:

	var mapping = {
		'children': {
			create: function(options) {
				return new myChildModel(options.data);
			}
		}
	}
	var viewModel = ko.mapping.fromJS(data, mapping);

The `options` argument supplied to your `create` callback is a JavaScript object containing:
 * `data`: The JavaScript object containing the data for this child
 * `parent`: The parent object or array to which this child belongs
 
Of course, inside the `create` callback you can do another call to `ko.mapping.fromJS` if you wish. A typical use-case might be if you want to augment the original JavaScript object with some additional [dependent observables](observables.html):

	var myChildModel = function(data) {
		ko.mapping.fromJS(data, {}, this);
		
		this.nameLength = ko.dependentObservable(function() {
			return this.name().length;
		}, this);
	}

###### Ignoring certain properties using "ignore"

If you want the mapping plugin to ignore some properties of your JS object (i.e. to not map them), you can specify a array of propertynames to ignore:

	var mapping = {
		'ignore': ["propertyToIgnore", "alsoIgnoreThis"]
	}
	var viewModel = ko.mapping.fromJS(data, mapping);

The `ignore` array you specify in the mapping options is combined with the default `ignore` array. You can manipulate this default array like this:

	var oldOptions = ko.mapping.defaultOptions().ignore;
    ko.mapping.defaultOptions().ignore = ["alwaysIgnoreThis"];
	
###### Including certain properties using "include"

When converting your view model back to a JS object, by default the mapping plugin will only include properties that were part of your original view model, except it will also include the Knockout-generated `_destroy` property even if it was not part of your original object. However, you can choose to customize this array:

	var mapping = {
		'include': ["propertyToInclude", "alsoIncludeThis"]
	}
	var viewModel = ko.mapping.fromJS(data, mapping);

The `include` array you specify in the mapping options is combined with the default `include` array, which by default only contains `_destroy`. You can manipulate this default array like this:

	var oldOptions = ko.mapping.defaultOptions().include;
    ko.mapping.defaultOptions().include = ["alwaysIncludeThis"];
	
###### Specifying the update target

If, like in the example above, you are performing the mapping inside of a class, you would like to have `this` as the target of your mapping operation. The third parameter to `ko.mapping.fromJS` indicates the target. For example,

	ko.mapping.fromJS(data, {}, someObject); // overwrites properties on someObject

So, if you would like to map a JavaScript object to `this`, you can pass `this` as the third argument:

	ko.mapping.fromJS(data, {}, this);

##### Mapping from multiple sources	
	
You can combine multiple JS objects in one viewmodel by applying multiple `ko.mapping.fromJS` calls, e.g.:

    var viewModel = ko.mapping.fromJS(alice, aliceMappingOptions);
	ko.mapping.fromJS(bob, bobMappingOptions, viewModel);
	
Mapping options that you specify in each call will be merged.

##### Mapped observable array

Observable arrays that are generated by the mapping plugin are augmented with a few functions that can make use of the `keys` mapping:

* mappedRemove
* mappedRemoveAll
* mappedDestroy
* mappedDestroyAll
* mappedIndexOf

They are functionally equivalent to the regular `ko.observableArray` functions, but can do things based on the key of the object. For example, this would work:

    var obj = [
        { id : 1 },
        { id : 2 }
    ]

    var result = ko.mapping.fromJS(obj, {
        key: function(item) {
            return ko.utils.unwrapObservable(item.id);
        }
    });
	
    result.mappedRemove({ id : 2 });

{% include plugin-download-link.html %}