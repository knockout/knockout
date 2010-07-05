/// <reference path="../src/binding/jsonExpressionRewriting.js" />

describe('JSON Expression Rewriting', {
    'Should be able to get the source code corresponding to a top-level key': function () {
        var parsed = ko.jsonExpressionRewriting.parseJson('{ a : { a : 123, b : 2 }, b : 1 + 1, c : "yeah" }');
        value_of(parsed.b).should_be("1 + 1");
    },

    'Should convert JSON values to property accessors': function () {
        var rewritten = ko.jsonExpressionRewriting.insertPropertyAccessorsIntoJson('a : 1, b : firstName, c : function() { return "returnValue"; }');

        var model = { firstName: "bob", lastName: "smith" };
        with (model) {
            var parsedRewritten = eval("({" + rewritten + "})");
            value_of(parsedRewritten.a).should_be(1);
            value_of(parsedRewritten.b).should_be("bob");
            value_of(parsedRewritten.c()).should_be("returnValue");

            parsedRewritten._ko_property_writers.b("bob2");
            value_of(model.firstName).should_be("bob2");
        }

    }
});