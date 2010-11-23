---
layout: documentation
title: Mapping
---

Knockout is designed to allow you to use arbitrary Javascript objects as viewmodels. As long as they contain [observables](observables.html) of some sort, you can use KO to bind to them. If the business logic of your website also happens in the client's browser, then this is fine. Most of the time, though, you will interact with a backend server. If your server provides you with a Javascript object containing updated data (e.g. in a stock ticker application), the mapping plugin allows you to automatically convert it into a viewmodel with the appropriate observables.

### Example

You want to display the current server-time and number of users on your webpage. Every 5 seconds you receive a Javascript object containing this data:

	var data = getDataUsingAjax();			// Gets the data from the server
	
The data object might look like this:

	{
		serverTime: '2010-01-07',
		numUsers: 3
	}
	
In order for KO to notice that these values has changed, you would have to create observables to bind to:

	var viewModel = {
		serverTime: ko.observable(),
		numUsers: ko.observable()
	}
	
Your HTML would look like this:

	The time on the server is: <span data-bind='text: serverTime'></span> and <span data-bind='text: numUsers'></span> user(s) are connected.
	
Finally, to connect the Javascript object to the observables, you would write:

	// Every time data is received from the server:
	viewModel.serverTime(data.serverTime);
	viewModel.numUsers(data.numUsers);
	
You would have to do this for every variable you want to display on your page. If your data structures become more complex (e.g. they contain children or contain arrays) this becomes very cumbersome to handle manually. What the mapping plugin allows you to do is create a `mapping` from the regular Javascript object (or JSON structure) to the KO viewmodel.

To create a mapping, replace the creation of the viewModel in the code above with the `ko.mapping.fromJS` function:

	var viewModel = ko.mapping.fromJS(data);
	
Then, every time you receive data, replace the code above with the `ko.mapping.updateFromJS` function:

	// Every time data is received from the server:
	ko.mapping.updateFromJS(viewModel, data);

### JSON

To use JSON data instead of Javascript objects, call `ko.mapping.fromJSON` and `ko.mapping.updateFromJSON`.

### How things are mapped

 * All properties of an object are converted into an observable. If an update would change the value, it will update the observable.
 * Arrays are converted into observable arrays. If an update would change the amount of items, it will perform the appropriate add/remove actions. It will also try to keep the order the same as the original Javascript array.
 
### Advanced usage

Sometimes it may be necessary to have more control over how the mapping is performed. This is accomplished using `mapping options`. They can be specified during the `ko.mapping.fromJS` call. In subsequent `ko.mapping.updateFromJS` you don't need to specify them again.

Here a few situations in which you might want to use these mapping options.

###### Key

Let's say you have a Javascript object that looks like this:

	var data = {
		name: 'Scot',
		children: [
			{ id : 1, name : 'Alicw' }
	}

You can map this to a viewModel without any problems:

	var viewModel = ko.mapping.fromJS(data);
	
Now, let's say the data is updated to be without any typos:

	var data = {
		name: 'Scott',
		children: [
			{ id : 1, name : 'Alice' }
	}
	
Two things have happened here: `name` was changed from `Scot` to `Scott` and `children[0].name` was changed from `Alicw` to the typo-free `Alice`. You can update `viewModel` based on this new data:

	ko.mapping.updateFromJS(viewModel, data);

And `name` would have changed as expected. However, in the `children` array, the child (Alicw) would have been completely removed and a new one (Alice) added. This is not completely what you would have expected. Instead, you would have expected that only the `name` property of the child was updated from `Alicw` to `Alice`, not that the entire child was replaced!

This happens because, by default, the mapping plugin simply compares the two objects in the array. And since in Javascript the object `{ id : 1, name : 'Alicw' }` does not equal `{ id : 1, name : 'Alice' }` it thinks that the *entire* child needs to be removed and replaced by a new one.

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
	
###### Create

If you want to handle a part of the mapping yourself, you can also provide a `create` callback. If this callback is present, the mapping plugin will allow you to do this part of the mapping yourself.

Let's say you have a Javascript object that looks like this:

	var data = {
		name: 'Graham',
		children: [
			{ id : 1, name : 'Lisa' }
	}

If you want to map the children array yourself, you can specify that like this:

	var mapping = {
		'children': {
			create: function(options) {
				return new myChildModel(options);
			}
		}
	}
	var viewModel = ko.mapping.fromJS(data, mapping);

The `options` argument is a Javascript containing:
 * `data`: The Javascript object containing the data for this child
 * `parent`: The parent object or array to which this child belongs
 
Ofcourse, inside the create callback you can do another call to `ko.mapping.fromJS` if you wish. A typical use-case might be if you want to augment the original Javascript object with some additional [dependent observables](observables.html):

	var myChildModel = function(options) {
		ko.mapping.fromJS(options.data, {}, this);
		
		this.nameLength = ko.dependentObservable(function() {
			return ko.utils.unwrapObservable(this.name).length();
		}, this);
	}

###### Mapping to 'this'

If, like in the example above, you are performing the mapping inside of a class, you would like to have `this` as the target of your mapping operation. The third parameter to `ko.mapping.fromJS` indicates the target. So these two statements are equivalent:

	var viewModel = ko.mapping.fromJS(data);
	ko.mapping.fromJS(data, {}, viewModel);		// equivalent to previous statement

So, if you would like to map a Javascript object to `this`, you can pass `this` as the third argument:

	ko.mapping.fromJS(data, {}, this);
