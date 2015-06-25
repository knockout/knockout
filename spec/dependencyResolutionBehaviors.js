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

    it('Should handle the complex graph when using computeds too', function() {

        /* Arrange */
        var a = ko.observable('a'),
            b = ko.computed(function() {
                return a() + 'b';
            }),
            c = ko.computed(function() {
                return a() + 'c';
            }),
            d = ko.computed(function() {
                return b() + c() + 'd';
            }),
            e = ko.computed(function() {
                return a() + 'e';
            }),
            f = ko.computed(function() {
                return a() + 'f';
            }),
            g = ko.computed(function() {
                return e() + f() + 'g';
            }),
            h = ko.computed(function() {
                return c() + g() + d() + 'h';
            }),
            i = ko.computed(function() {
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

    it('Should prioritise older subscriptions over newer ones', function() {

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

    it('Should prioritise computed subscriptions over explicit ones', function() {

        /* Arrange */
        var a = ko.observable('a'),
            spy = jasmine.createSpy('callback'),
            subscription = a.subscribe(spy),
            b = ko.computed(function() {
                if (a() === 'aa') {
                    subscription.dispose();
                }
            });

        /* Act */
        a('aa');

        /* Assert */
        expect(spy.calls.length).toEqual(0);

    });

    it('Should discard waiting subscriptions when another subscription changes the value', function() {

        /* Arrange */
        var a = ko.observable('a'),
            spy = jasmine.createSpy('callback');

        a.subscribe(function(value) {
            if (value === 'aa') {
                a(value + 'A');
            }
        });

        a.subscribe(spy);

        /* Act */
        a('aa');

        /* Assert */
        expect(spy.calls.length).toEqual(1);
        expect(spy.argsForCall[0][0]).toEqual('aaA');

    });

    it('Should discard waiting subscriptions further down the tree when another subscription changes the value', function() {

        /* Arrange */
        var a = ko.observable('a'),
            b = ko.computed(function() {
                return 'b';
            }),
            c = ko.computed(function() {
                var out = a();
                out += b();
                return out;
            }),
            spy = jasmine.createSpy('callback');

        a.subscribe(function(value) {
            if (value === 'aa') {
                a(value + 'A');
            }
        });

        c.subscribe(function(v) {
            spy(v);
        });

        /* Act */
        a('aa');

        /* Assert */
        expect(spy.calls.length).toEqual(1);
        expect(spy.argsForCall[0][0]).toEqual('aaAb');

    });
});