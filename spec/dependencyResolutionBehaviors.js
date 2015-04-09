describe('Dependency Resolution', function() {

    it('Should not evaluate dependencies at the end of a simple graph multiple times', function() {

        /* Arrange */
        var a = ko.observable('a'),
            b = ko.pureComputed(function() {
                return a() + 'b';
            }),
            c = ko.pureComputed(function() {
                return a() + b() + 'c';
            }),
            spy = jasmine.createSpy('callback');

        c.subscribe(spy);

        /* Act */
        a('aaa');

        /* Assert */
        expect(spy.calls.length).toEqual(1);
        expect(spy.argsForCall[0][0]).toEqual('aaaaaabc');

    });

    it('Should not evaluate dependencies at the end of a complex graph multiple times', function() {

        /* Arrange */
        var a = ko.observable('a'),
            b = ko.pureComputed(function() {
                return a() + 'b';
            }),
            c = ko.pureComputed(function() {
                return a() + 'c';
            }),
            d = ko.pureComputed(function() {
                return b() + c() + 'd';
            }),
            e = ko.pureComputed(function() {
                return a() + 'e';
            }),
            f = ko.pureComputed(function() {
                return a() + 'f';
            }),
            g = ko.pureComputed(function() {
                return e() + f() + 'g';
            }),
            h = ko.pureComputed(function() {
                return c() + g() + d() + 'h';
            }),
            i = ko.pureComputed(function() {
                return a() + h() + b() + f();
            }),
            spy = jasmine.createSpy('callback');

        i.subscribe(spy);

        /* Act */
        a('aa');

        /* Assert */
        expect(spy.calls.length).toEqual(1);
        expect(spy.argsForCall[0][0]).toEqual('aaaacaaeaafgaabaacdhaabaaf');

    });

    it('Should prioritise subscriptions deeper in the graph', function() {

        /* Arrange */
        var a = ko.observable('a'),
            b = ko.computed(function() {
                return a() + 'b';
            }),
            spy = jasmine.createSpy('callback'),
            subscription;

        b.subscribe(function(b) {
            if (b === 'aab') {
                subscription.dispose();
            }
        });

        subscription = a.subscribe(spy);

        /* Act */
        a('aa');

        /* Assert */
        expect(spy.calls.length).toEqual(0);

    });

});