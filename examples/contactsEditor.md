---
layout: example
title: Contacts editor example
---

This example is a duplicate of the <a href="http://github.com/nje/jquery-datalink">contacts editor</a> sample provided with Microsoft's <a href='http://wiki.github.com/nje/jquery-datalink/jquery-data-linking-proposal'>jQuery Data Linking Proposal</a>. I wanted to see whether the implementation would be harder or easier with Knockout. 

It's not the number of lines of code that's so important (though the Knockout implementation is quite concise); what matters is how easily you can understand the code at a glance. Check the HTML source code to see how simple the viewModel is, and how straightforward it is to bind the template to it.

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
                    <div><a href='#' data-bind='click: function() { $root.removeContact($data); }'>Delete</a></div>
                </td>
                <td><input data-bind='value: lastName' /></td>
                <td>
                    <table>
                        <tbody data-bind="foreach: phones">
                            <tr>
                                <td><input data-bind='value: type' /></td>
                                <td><input data-bind='value: number' /></td>
                                <td><a href='#' data-bind='click: function() { $root.removePhone($parent, $data); }'>Delete</a></td>
                            </tr>
                        </tbody>
                    </table>
                    <a href='#' data-bind='click: function() { $root.addPhone($data); }'>Add number</a>
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

    var ViewModel = function(contacts) {
        this.contacts = ko.observableArray(ko.utils.arrayMap(contacts, function(contact) {
            return { firstName: contact.firstName, lastName: contact.lastName, phones: ko.observableArray(contact.phones) };
        }));

        this.addContact = function() {
            this.contacts.push({
                firstName: "",
                lastName: "",
                phones: ko.observableArray()
            });
        };

        this.removeContact = function(contact) {
            this.contacts.remove(contact);
        };

        this.addPhone = function(contact) {
            contact.phones.push({
                type: "",
                number: ""
            });
        };

        this.removePhone = function(contact, phone) {
            contact.phones.remove(phone);
        };

        this.save = function() {
            this.lastSavedJson(JSON.stringify(ko.toJS(this.contacts), null, 2));
        };

        this.lastSavedJson = ko.observable("")
    };

    ko.applyBindings(new ViewModel(initialData));
{% endcapture %}
{% include live-example-tabs.html %}