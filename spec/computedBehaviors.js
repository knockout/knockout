describe('Computed', function() {
    it('Should evaluate on subscribe', function () {
        var evaluated = false;
        var computed = ko.computed({
            read: function () {
                evaluated = true;
            },
            deferEvaluation: true
        });

        expect(evaluated).toEqual(false);

        computed.subscribe(function() {});

        expect(evaluated).toEqual(true);
    });

    it('Should not evaluate on subscribe when deferEvaluation && deferSubscribeEvaluation', function () {
        var evaluated = false;

        var dependent = ko.observable();

        var computed = ko.computed({
            read: function () {
                evaluated = true;
                return dependent();
            },
            deferEvaluation: true,
            deferSubscribeEvaluation: true
        });
        expect(evaluated).toEqual(false);

        var emmitedValue;
        computed.subscribe(function(val) { emmitedValue = val; });

        expect(evaluated).toEqual(false);

        dependent('foo');

        expect(evaluated).toEqual(false);

        expect(computed()).toEqual('foo');
        //expect(emmitedValue).toEqual('foo');

        expect(evaluated).toEqual(true);

        dependent('bar');
        expect(emmitedValue).toEqual('bar');
        expect(computed()).toEqual('bar');


    });
});
