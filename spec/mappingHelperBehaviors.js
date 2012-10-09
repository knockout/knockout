
describe('Mapping helpers', {
    'ko.toJS should require a parameter': function() {
        var didThrow = false;
        try { ko.toJS() }
        catch(ex) { didThow = true }
        value_of(didThow).should_be(true);
    },

    'ko.toJS should unwrap observable values': function() {
        var atomicValues = ["hello", 123, true, null, undefined, { a : 1 }];
        for (var i = 0; i < atomicValues.length; i++) {
            var data = ko.observable(atomicValues[i]);
            var result = ko.toJS(data);
            value_of(ko.isObservable(result)).should_be(false);
            value_of(result).should_be(atomicValues[i]);
        }
    },

    'ko.toJS should recursively unwrap observables whose values are themselves observable': function() {
        var weirdlyNestedObservable = ko.observable(
            ko.observable(
                ko.observable(
                    ko.observable('Hello')
                )
            )
        );
        var result = ko.toJS(weirdlyNestedObservable);
        value_of(result).should_be('Hello');
    },

    'ko.toJS should unwrap observable properties, including nested ones': function() {
        var data = {
            a : ko.observable(123),
            b : {
                b1 : ko.observable(456),
                b2 : [789, ko.observable('X')]
            }
        };
        var result = ko.toJS(data);
        value_of(result.a).should_be(123);
        value_of(result.b.b1).should_be(456);
        value_of(result.b.b2[0]).should_be(789);
        value_of(result.b.b2[1]).should_be('X');
    },

    'ko.toJS should unwrap observable arrays and things inside them': function() {
        var data = ko.observableArray(['a', 1, { someProp : ko.observable('Hey') }]);
        var result = ko.toJS(data);
        value_of(result.length).should_be(3);
        value_of(result[0]).should_be('a');
        value_of(result[1]).should_be(1);
        value_of(result[2].someProp).should_be('Hey');
    },

    'ko.toJS should resolve reference cycles': function() {
        var obj = {};
        obj.someProp = { owner : ko.observable(obj) };
        var result = ko.toJS(obj);
        value_of(result.someProp.owner).should_be(result);
    },

    'ko.toJS should treat Date instances as primitives (and not walk their subproperties)': function () {
        var date = new Date();
        var result = ko.toJS({ due: ko.observable(date) });
        value_of(result.due instanceof Date).should_be(true);
        value_of(result.due).should_be(date);
    },

    'ko.toJSON should unwrap everything and then stringify': function() {
        var data = ko.observableArray(['a', 1, { someProp : ko.observable('Hey') }]);
        var result = ko.toJSON(data);

        // Check via parsing so the specs are independent of browser-specific JSON string formatting
        value_of(typeof result).should_be('string');
        var parsedResult = ko.utils.parseJson(result);
        value_of(parsedResult.length).should_be(3);
        value_of(parsedResult[0]).should_be('a');
        value_of(parsedResult[1]).should_be(1);
        value_of(parsedResult[2].someProp).should_be('Hey');
    },

    'ko.toJSON should respect .toJSON functions on arrays': function() {
        var data = {
            a: [1, 2],
            b: ko.observableArray([3, 4])
        };
        data.a.toJSON = function() { return "a-mapped" };
        data.b().toJSON = function() { return "b-mapped" };
        var result = ko.toJSON(data);

        // Check via parsing so the specs are independent of browser-specific JSON string formatting
        value_of(typeof result).should_be('string');
        var parsedResult = ko.utils.parseJson(result);
        value_of(parsedResult).should_be({ a: "a-mapped", b: "b-mapped" });
    },

    'ko.toJSON should respect replacer/space options': function() {
        var data = { a: 1 };

        // Without any options
        value_of(ko.toJSON(data)).should_be("{\"a\":1}");

        // With a replacer
        function myReplacer(x, obj) {
            value_of(obj).should_be(data);
            return "my replacement";
        };
        value_of(ko.toJSON(data, myReplacer)).should_be("\"my replacement\"");

        // With spacer
        value_of(ko.toJSON(data, undefined, "    ")).should_be_one_of([
            "{\n    \"a\":1\n}",  // Firefox 3.6, for some reason, omits the space after the colon. Doesn't really matter to us.
            "{\n    \"a\": 1\n}"  // All other browsers produce this format
        ]);
    }
})
