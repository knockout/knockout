
describe('Mapping helpers', function() {
    it('ko.toJS should require a parameter', function() {
        expect(function () {
            ko.toJS();
        }).toThrow();
    });

    it('ko.toJS should unwrap observable values', function() {
        var atomicValues = ["hello", 123, true, null, undefined, { a : 1 }];
        for (var i = 0; i < atomicValues.length; i++) {
            var data = ko.observable(atomicValues[i]);
            var result = ko.toJS(data);
            expect(ko.isObservable(result)).toEqual(false);
            expect(result).toEqual(atomicValues[i]);
        }
    });

    it('ko.toJS should recursively unwrap observables whose values are themselves observable', function() {
        var weirdlyNestedObservable = ko.observable(
            ko.observable(
                ko.observable(
                    ko.observable('Hello')
                )
            )
        );
        var result = ko.toJS(weirdlyNestedObservable);
        expect(result).toEqual('Hello');
    });

    it('ko.toJS should unwrap observable properties, including nested ones', function() {
        var data = {
            a : ko.observable(123),
            b : {
                b1 : ko.observable(456),
                b2 : [789, ko.observable('X')]
            }
        };
        var result = ko.toJS(data);
        expect(result.a).toEqual(123);
        expect(result.b.b1).toEqual(456);
        expect(result.b.b2[0]).toEqual(789);
        expect(result.b.b2[1]).toEqual('X');
    });

    it('ko.toJS should unwrap observable arrays and things inside them', function() {
        var data = ko.observableArray(['a', 1, { someProp : ko.observable('Hey') }]);
        var result = ko.toJS(data);
        expect(result.length).toEqual(3);
        expect(result[0]).toEqual('a');
        expect(result[1]).toEqual(1);
        expect(result[2].someProp).toEqual('Hey');
    });

    it('ko.toJS should resolve reference cycles', function() {
        var obj = {};
        obj.someProp = { owner : ko.observable(obj) };
        var result = ko.toJS(obj);
        expect(result.someProp.owner).toEqual(result);
    });

    it('ko.toJS should treat RegExp, Date, Number, String and Boolean instances as primitives (and not walk their subproperties)', function () {
        var regExp = new RegExp();
        var date = new Date();
        var string = new String();
        var number = new Number();
        var booleanValue = new Boolean(); // 'boolean' is a resever word in Javascript

        var result = ko.toJS({
            regExp: ko.observable(regExp),
            due: ko.observable(date),
            string: ko.observable(string),
            number: ko.observable(number),
            booleanValue: ko.observable(booleanValue)
        });

        expect(result.regExp instanceof RegExp).toEqual(true);
        expect(result.regExp).toEqual(regExp);

        expect(result.due instanceof Date).toEqual(true);
        expect(result.due).toEqual(date);

        expect(result.string instanceof String).toEqual(true);
        expect(result.string).toEqual(string);

        expect(result.number instanceof Number).toEqual(true);
        expect(result.number).toEqual(number);

        expect(result.booleanValue instanceof Boolean).toEqual(true);
        expect(result.booleanValue).toEqual(booleanValue);
    });

    it('ko.toJS should serialize functions', function() {
        var obj = {
            include: ko.observable("test"),
            exclude: function(){}
        };

        var result = ko.toJS(obj);
        expect(result.include).toEqual("test");
        expect(result.exclude).toEqual(obj.exclude);
    });

    it('ko.toJSON should unwrap everything and then stringify', function() {
        var data = ko.observableArray(['a', 1, { someProp : ko.observable('Hey') }]);
        var result = ko.toJSON(data);

        // Check via parsing so the specs are independent of browser-specific JSON string formatting
        expect(typeof result).toEqual('string');
        var parsedResult = ko.utils.parseJson(result);
        expect(parsedResult.length).toEqual(3);
        expect(parsedResult[0]).toEqual('a');
        expect(parsedResult[1]).toEqual(1);
        expect(parsedResult[2].someProp).toEqual('Hey');
    });

    it('ko.toJSON should respect .toJSON functions on objects', function() {
        var data = {
            a: { one: "one", two: "two"},
            b: ko.observable({ one: "one", two: "two" })
        };
        data.a.toJSON = function() { return "a-mapped" };
        data.b().toJSON = function() { return "b-mapped" };
        var result = ko.toJSON(data);

        // Check via parsing so the specs are independent of browser-specific JSON string formatting
        expect(typeof result).toEqual("string");
        var parsedResult = ko.utils.parseJson(result);
        expect(parsedResult).toEqual({ a: "a-mapped", b: "b-mapped" });
    });

    it('ko.toJSON should respect .toJSON functions on arrays', function() {
        var data = {
            a: [1, 2],
            b: ko.observableArray([3, 4])
        };
        data.a.toJSON = function() { return "a-mapped" };
        data.b().toJSON = function() { return "b-mapped" };
        var result = ko.toJSON(data);

        // Check via parsing so the specs are independent of browser-specific JSON string formatting
        expect(typeof result).toEqual('string');
        var parsedResult = ko.utils.parseJson(result);
        expect(parsedResult).toEqual({ a: "a-mapped", b: "b-mapped" });
    });

    it('ko.toJSON should respect replacer/space options', function() {
        var data = { a: 1 };

        // Without any options
        expect(ko.toJSON(data)).toEqual("{\"a\":1}");

        // With a replacer
        function myReplacer(x, obj) {
            expect(obj).toEqual(data);
            return "my replacement";
        };
        expect(ko.toJSON(data, myReplacer)).toEqual("\"my replacement\"");

        // With spacer
        expect(ko.toJSON(data, undefined, "    ")).toEqualOneOf([
            "{\n    \"a\":1\n}",  // Firefox 3.6, for some reason, omits the space after the colon. Doesn't really matter to us.
            "{\n    \"a\": 1\n}"  // All other browsers produce this format
        ]);
    });
})
