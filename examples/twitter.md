---
layout: example
title: Twitter client example
---

This is a sophisticated example showing how many different features in Knockout can be combined to make a rich user interface.

 * The user data is stored as a JavaScript model and rendered via templates. This means we can cleanly retain information about which Twitter users are in each of the user lists without having to hide it in the DOM anywhere.
 * Buttons become enabled and disabled according to whether they are applicable. For example, we have a `dependentObservable` called `hasUnsavedChanges` that controls whether the "Save" button is enabled.
 * It's convenient to pull in data from external JSON services and integrate it into the view model, at which point it becomes displayed on screen.

<link rel="Stylesheet" href="resources/twitterExample.css" />
<script type="text/javascript" src="resources/twitterApi.js"> </script>
<style type="text/css">
   .liveExample select { height: 1.7em; }
   .liveExample button { height: 2em; }
</style>

{% capture live_example_view %}
<div class="loadingIndicator">Loading...</div>
<div class="configuration">
    <div class="listChooser">
        <button data-bind='click: deleteList, enable: editingList.name'>Delete</button>
        <button data-bind='click: saveChanges, enable: hasUnsavedChanges'>Save</button>
        <select data-bind='options: savedLists, optionsValue: "name", value: editingList.name'> </select>
    </div>

    <p>Currently viewing <span data-bind="text: editingList.userNames().length">&nbsp;</span> user(s):</p>
    <div class="currentUsers" data-bind='template: { name: "usersTemplate", data: editingList }'> </div>
    
    <form data-bind="submit: addUser">
        <label>Add user:</label>
        <input data-bind='value: userNameToAdd, valueUpdate: "keyup", css: { invalid: !userNameToAddIsValid() }' />
        <button type="submit" data-bind='enable: userNameToAddIsValid() && userNameToAdd() != ""'>Add</button>
    </form>
</div>
<div class="tweets" data-bind='template: { name: "tweetsTemplate", data: currentTweets }'> </div>

<script type="text/html" id="tweetsTemplate">
    <table width="100%">
        {{'{{'}}each $data}}
            <tr>
                <td><img src="${ profile_image_url }"/></td>
                <td>
                    <a class="twitterUser" href="http://twitter.com/${ from_user }">${ from_user }</a>
                    ${ text }
                    <div class="tweetInfo">${ created_at }</div>
                </td>
            </tr>
        {{'{{'}}/each}}
    </table>
</script>

<script type="text/html" id="usersTemplate">
    <ul>
        {{'{{'}}each(i, userName) userNames()}}
            <li><button data-bind="click: function() { userNames.remove(userName) }">Remove</button> <div>${ userName }</div></li>
        {{'{{'}}/each}}
    </ul>
</script>

{% endcapture %}

{% capture live_example_viewmodel %}
    // The view model holds all the state we're working with. It also has methods that can edit it, and it uses
    // dependentObservables to compute more state in terms of the underlying data
    // --
    // The view (i.e., the HTML UI) binds to this using data-bind attributes, so it always stays up-to-date with
    // the view model, even though the view model does not know or care about any view that binds to it

    var viewModel = {
        savedLists: ko.observableArray([
            { name: "Celebrities", userNames: ['JohnCleese', 'MCHammer', 'StephenFry', 'algore', 'StevenSanderson'] },
            { name: "Microsoft people", userNames: ['BillGates', 'shanselman', 'haacked', 'ScottGu'] },
            { name: "Tech pundits", userNames: ['Scobleizer', 'LeoLaporte', 'techcrunch', 'BoingBoing', 'timoreilly', 'codinghorror'] }
        ]),
        editingList: {
            name: ko.observable("Tech pundits"),
            userNames: ko.observableArray()
        },
        userNameToAdd : ko.observable(""),
        currentTweets : ko.observableArray([])
    };

    viewModel.findSavedList = function (name) {
        var lists = this.savedLists();
        for (var i = 0; i < lists.length; i++)
            if (lists[i].name === name)
                return lists[i];
    };

    // Methods
    viewModel.addUser = function () {
        if (this.userNameToAdd() && this.userNameToAddIsValid()) {
            this.editingList.userNames.push(this.userNameToAdd());
            this.userNameToAdd("");
        }
    }
    viewModel.saveChanges = function () {
        var saveAs = prompt("Save as", this.editingList.name());
        if (saveAs) {
            var dataToSave = this.editingList.userNames().slice(0);
            var existingSavedList = this.findSavedList(saveAs);
            if (existingSavedList)
                existingSavedList.userNames = dataToSave; // Overwrite existing list
            else
                this.savedLists.push({ name: saveAs, userNames: dataToSave }); // Add new list
            this.editingList.name(saveAs);
        }
    }
    viewModel.deleteList = function () {
        var nameToDelete = this.editingList.name();
        var savedListsExceptOneToDelete = $.grep(this.savedLists(), function (list) { return list.name != nameToDelete });
        this.editingList.name(savedListsExceptOneToDelete.length == 0 ? null : savedListsExceptOneToDelete[0].name);
        this.savedLists(savedListsExceptOneToDelete);
    };

    ko.dependentObservable(function () {
        // Observe viewModel.editingList.name(), so when it changes (i.e., user selects a different list) we know to copy the saved list into the editing list
        var savedList = viewModel.findSavedList(viewModel.editingList.name());
        if (savedList) {
            var userNamesCopy = savedList.userNames.slice(0);
            viewModel.editingList.userNames(userNamesCopy);
        } else
            viewModel.editingList.userNames([]);
    });

    viewModel.hasUnsavedChanges = ko.dependentObservable(function () {
        if (!this.editingList.name())
            return this.editingList.userNames().length > 0;
        var savedData = this.findSavedList(this.editingList.name()).userNames;
        var editingData = this.editingList.userNames();
        return savedData.join("|") != editingData.join("|");
    }, viewModel);

    viewModel.userNameToAddIsValid = ko.dependentObservable(function () {
        return (this.userNameToAdd() == "") || (this.userNameToAdd().match(/^\s*[a-zA-Z0-9_]{1,15}\s*$/) != null);
    }, viewModel);

    // The active user tweets are (asynchronously) computed from editingList.userNames
    ko.dependentObservable(function () {
        twitterApi.getTweetsForUsers(this.editingList.userNames(), function (data) { viewModel.currentTweets(data) })
    }, viewModel);

    ko.applyBindings(viewModel);

	// Using jQuery for Ajax loading indicator - nothing to do with Knockout
    $(".loadingIndicator").ajaxStart(function () { $(this).fadeIn(); })      
                          .ajaxComplete(function () { $(this).fadeOut(); }); 
{% endcapture %}
{% include live-example-tabs.html %}