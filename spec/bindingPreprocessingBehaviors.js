describe('Binding preprocessing', function() {
    it('Should allow binding to modify value through "preprocess" method', function() {
        delete ko.bindingHandlers.a;
        // create binding that has a default value of false
        ko.bindingHandlers.b = {
            preprocess: function(value) {
                return value || "false";
            }
        };
        var rewritten = ko.expressionRewriting.preProcessBindings("a: 1, b");
        var parsedRewritten = eval("({" + rewritten + "})");
        expect(parsedRewritten.a).toEqual(1);
        expect(parsedRewritten.b).toEqual(false);
    });

    it('Should allow binding to add/replace bindings through "preprocess" method\'s "addBinding" callback', function() {
        ko.bindingHandlers.a = {
            preprocess: function(value, key, addBinding) {
                // the a binding will be copied to a2
                addBinding(key+"2", value);
                return value;
            }
        };
        ko.bindingHandlers.b = {
            preprocess: function(value, key, addBinding) {
                // the b binding will be replaced by b2
                addBinding(key+"2", value);
            }
        };
        var rewritten = ko.expressionRewriting.preProcessBindings("a: 1, b: 2");
        var parsedRewritten = eval("({" + rewritten + "})");

        expect(parsedRewritten.a).toEqual(1);
        expect(parsedRewritten.a2).toEqual(1);

        expect(parsedRewritten.b).toBeUndefined();
        expect(parsedRewritten.b2).toEqual(2);
    });

    it('Should be able to chain "preprocess" calls when one adds a binding for another', function() {
        ko.bindingHandlers.a = {
            preprocess: function(value, key, addBinding) {
                // replace with b
                addBinding("b", value);
            }
        };
        ko.bindingHandlers.b = {
            preprocess: function(value, key, addBinding) {
                // adds 1 to value
                return '' + (+value + 1);
            }
        };
        var rewritten = ko.expressionRewriting.preProcessBindings("a: 2");
        var parsedRewritten = eval("({" + rewritten + "})");
        expect(parsedRewritten.a).toBeUndefined();
        expect(parsedRewritten.b).toEqual(3);
    });

    it('Should be able to get a dynamically created binding handler during preprocessing', function() {
        this.restoreAfter(ko, 'getBindingHandler'); // restore original function when done

        ko.getBindingHandler = function(bindingKey) {
            return {
                preprocess: function(value) {
                    return value + '2';
                }
            };
        };
        var rewritten = ko.expressionRewriting.preProcessBindings("a: 1");

        var parsedRewritten = eval("({" + rewritten + "})");
        expect(parsedRewritten.a).toEqual(12);
    });
});
