---
layout: example
title: Contacts editor example
---

This examples shows a fairly typical way to edit a nested data structure. Check the HTML source code to see how simple the viewmodel is, and how straightforward it is to bind the view to it.

<style type="text/css">
    .liveExample TR { vertical-align: top; }
    .liveExample TABLE, .liveExample TD, .liveExample TH { padding: 0.2em; border-width: 0; margin: 0; }
    .liveExample TD A { font-size: 0.8em; text-decoration: none; }
    .liveExample table.contactsEditor > tbody > TR { border-bottom: 1px solid silver; }
    .liveExample td input { width: 8em; }
</style>

{% capture live_example_view %} 
<h2>Contacts</h2>
<div id='contactsList'>
    <table class='contactsEditor'>
        <tr>
            <th>First name</th>
            <th>Last name</th>
            <th>Phone numbers</th>
        </tr>
        <tbody data-bind="foreach: contacts">
            <tr>
                <td>
                    <input data-bind='value: firstName' />
                    <div><a href='#' data-bind='click: $root.removeContact'>Delete</a></div>
                </td>
                <td><input data-bind='value: lastName' /></td>
                <td>
                    <table>
                        <tbody data-bind="foreach: phones">
                            <tr>
                                <td><input data-bind='value: type' /></td>
                                <td><input data-bind='value: number' /></td>
                                <td><a href='#' data-bind='click: $root.removePhone'>Delete</a></td>
                            </tr>
                        </tbody>
                    </table>
                    <a href='#' data-bind='click: $root.addPhone'>Add number</a>
                </td>
            </tr>
        </tbody>
    </table>
</div>

<p>
    <button data-bind='click: addContact'>Add a contact</button>
    <button data-bind='click: save, enable: contacts().length > 0'>Save to JSON</button>
</p>

<textarea data-bind='value: lastSavedJson' rows='5' cols='60' disabled='disabled'> </textarea>
{% endcapture %}

{% capture live_example_viewmodel %}
    var initialData = [
        { firstName: "Danny", lastName: "LaRusso", phones: [
            { type: "Mobile", number: "(555) 121-2121" },
            { type: "Home", number: "(555) 123-4567"}]
        },
        { firstName: "Sensei", lastName: "Miyagi", phones: [
            { type: "Mobile", number: "(555) 444-2222" },
            { type: "Home", number: "(555) 999-1212"}]
        }
    ];

    var ContactsModel = function(contacts) {
        var self = this;
        self.contacts = ko.observableArray(ko.utils.arrayMap(contacts, function(contact) {
            return { firstName: contact.firstName, lastName: contact.lastName, phones: ko.observableArray(contact.phones) };
        }));

        self.addContact = function() {
            self.contacts.push({
                firstName: "",
                lastName: "",
                phones: ko.observableArray()
            });
        };

        self.removeContact = function(contact) {
            self.contacts.remove(contact);
        };

        self.addPhone = function(contact) {
            contact.phones.push({
                type: "",
                number: ""
            });
        };

        self.removePhone = function(phone) {
            $.each(self.contacts(), function() { this.phones.remove(phone) })
        };

        self.save = function() {
            self.lastSavedJson(JSON.stringify(ko.toJS(self.contacts), null, 2));
        };

        self.lastSavedJson = ko.observable("")
    };

    ko.applyBindings(new ContactsModel(initialData));
{% endcapture %}
{% include live-example-tabs.html %}

[Try it in jsFiddle](http://jsfiddle.net/rniemeyer/gZC5k/)