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

    it('Should not evaluate on subscribe when deferEvaluation && deferSubscribeEvaluation && trackArrayChanges', function () {

        var evaluated = false;

        var dependent = ko.observableArray();

        var computed = ko.computed({
            read: function () {
                evaluated = true;
                return dependent();
            },
            deferEvaluation: true,
            deferSubscribeEvaluation: true
        }).extend({ 'trackArrayChanges': true });

        expect(evaluated).toEqual(false);

        var emmitedValue;
        computed.subscribe(function(val) {
            emmitedValue = val;
        }, null, 'arrayChange');

        expect(evaluated).toEqual(false);

        dependent.push('foo');

        expect(evaluated).toEqual(false);

        expect(computed()).toEqual(['foo']);

        expect(evaluated).toEqual(true);

        dependent.push('bar');
        expect(emmitedValue).toEqual([
            { status : 'added', value : 'foo', index : 0 },
            { status : 'added', value : 'bar', index : 1 }
        ]);
        expect(computed()).toEqual(['foo', 'bar']);

    });
});