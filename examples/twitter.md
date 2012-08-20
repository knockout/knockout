---
layout: example
title: Twitter client example
---

This is a sophisticated example showing how many different features in Knockout can be combined to make a rich user interface.

 * The user data is stored as a JavaScript model and rendered based on the selected list. This means we can cleanly retain information about which Twitter users are in each of the user lists without having to hide it in the DOM anywhere.
 * Buttons become enabled and disabled according to whether they are applicable. For example, we have a `computed` property called `hasUnsavedChanges` that controls whether the "Save" button is enabled.
 * It's convenient to pull in data from external JSON services and integrate it into the view model, at which point it becomes displayed on screen.

<link rel="Stylesheet" href="resources/twitterExample.css" />
<script type="text/javascript" src="resources/twitterApi.js"> </script>
<style type="text/css">
   .liveExample select { height: 1.7em; }
   .liveExample button { height: 2em; }
</style>

{% capture live_example_view %}
<div class='configuration'>
    <div class='listChooser'>
        <button data-bind='click: deleteList, enable: editingList.name'>Delete</button>
        <button data-bind='click: saveChanges, enable: hasUnsavedChanges'>Save</button>
        <select data-bind='options: savedLists, optionsValue: "name", value: editingList.name'> </select>
    </div>

    <p>Currently viewing <span data-bind='text: editingList.userNames().length'> </span> user(s):</p>
    <div class='currentUsers' data-bind='with: editingList'>
        <ul data-bind='foreach: userNames'>
            <li>
                <button data-bind='click: $root.removeUser'>Remove</button>
                <div data-bind="text: $data"> </div>
            </li>
        </ul>
    </div>

    <form data-bind='submit: addUser'>
        <label>Add user:</label>
        <input data-bind='value: userNameToAdd, valueUpdate: "keyup", css: { invalid: !userNameToAddIsValid() }' />
        <button data-bind='enable: canAddUserName' type='submit'>Add</button>
    </form>
</div>
<div class='tweets'>
    <div class='loadingIndicator'>Loading...</div>
    <table width='100%' data-bind="foreach: currentTweets">
        <tr>
            <td><img data-bind='attr: { src: profile_image_url }' /></td>
            <td>
                <a class='twitterUser' data-bind='attr: { href: "http://twitter.com/" + from_user }, text: from_user' href='http://twitter.com/${ from_user }' > </a>
                <span data-bind="text: text"> </span>
                <div class='tweetInfo' data-bind='text: created_at'> </div>
            </td>
        </tr>
    </table>
</div>
{% endcapture %}

{% capture live_example_viewmodel %}
    // The view model holds all the state we're working with. It also has methods that can edit it, and it uses
    // computed observables to calculate more state in terms of the underlying data
    // --
    // The view (i.e., the HTML UI) binds to this using data-bind attributes, so it always stays up-to-date with
    // the view model, even though the view model does not know or care about any view that binds to it
    var savedLists = [
        { name: "Celebrities", userNames: ['JohnCleese', 'MCHammer', 'StephenFry', 'algore', 'StevenSanderson']},
        { name: "Microsoft people", userNames: ['BillGates', 'shanselman', 'ScottGu']},
        { name: "Tech pundits", userNames: ['Scobleizer', 'LeoLaporte', 'techcrunch', 'BoingBoing', 'timoreilly', 'codinghorror']}
    ];

    var TwitterListModel = function(lists, selectedList) {
        this.savedLists = ko.observableArray(lists);
        this.editingList = {
            name: ko.observable(selectedList),
            userNames: ko.observableArray()
        };
        this.userNameToAdd = ko.observable("");
        this.currentTweets = ko.observableArray([])

        this.findSavedList = function(name) {
            var lists = this.savedLists();
            return ko.utils.arrayFirst(lists, function(list) {
                return list.name === name;
            });
        };

        this.addUser = function() {
            if (this.userNameToAdd() && this.userNameToAddIsValid()) {
                this.editingList.userNames.push(this.userNameToAdd());
                this.userNameToAdd("");
            }
        };

        this.removeUser = function(userName) { 
            this.editingList.userNames.remove(userName) 
        }.bind(this);

        this.saveChanges = function() {
            var saveAs = prompt("Save as", this.editingList.name());
            if (saveAs) {
                var dataToSave = this.editingList.userNames().slice(0);
                var existingSavedList = this.findSavedList(saveAs);
                if (existingSavedList) existingSavedList.userNames = dataToSave; // Overwrite existing list
                else this.savedLists.push({
                    name: saveAs,
                    userNames: dataToSave
                }); // Add new list
                this.editingList.name(saveAs);
            }
        };

        this.deleteList = function() {
            var nameToDelete = this.editingList.name();
            var savedListsExceptOneToDelete = $.grep(this.savedLists(), function(list) {
                return list.name != nameToDelete
            });
            this.editingList.name(savedListsExceptOneToDelete.length == 0 ? null : savedListsExceptOneToDelete[0].name);
            this.savedLists(savedListsExceptOneToDelete);
        };

        ko.computed(function() {
            // Observe viewModel.editingList.name(), so when it changes (i.e., user selects a different list) we know to copy the saved list into the editing list
            var savedList = this.findSavedList(this.editingList.name());
            if (savedList) {
                var userNamesCopy = savedList.userNames.slice(0);
                this.editingList.userNames(userNamesCopy);
            } else {
                this.editingList.userNames([]);
            }
        }, this);

        this.hasUnsavedChanges = ko.computed(function() {
            if (!this.editingList.name()) {
                return this.editingList.userNames().length > 0;
            }
            var savedData = this.findSavedList(this.editingList.name()).userNames;
            var editingData = this.editingList.userNames();
            return savedData.join("|") != editingData.join("|");
        }, this);

        this.userNameToAddIsValid = ko.computed(function() {
            return (this.userNameToAdd() == "") || (this.userNameToAdd().match(/^\s*[a-zA-Z0-9_]{1,15}\s*$/) != null);
        }, this);

        this.canAddUserName = ko.computed(function() {
            return this.userNameToAddIsValid() && this.userNameToAdd() != "";
        }, this);

        // The active user tweets are (asynchronously) computed from editingList.userNames
        ko.computed(function() {
            twitterApi.getTweetsForUsers(this.editingList.userNames(), this.currentTweets);
        }, this);
    };

    ko.applyBindings(new TwitterListModel(savedLists, "Tech pundits"));

    // Using jQuery for Ajax loading indicator - nothing to do with Knockout
    $(".loadingIndicator").ajaxStart(function() {
        $(this).fadeIn();
    }).ajaxComplete(function() {
        $(this).fadeOut();
    });
{% endcapture %}
{% include live-example-tabs.html %}

[Try it in jsFiddle](http://jsfiddle.net/rniemeyer/rhQLj/)