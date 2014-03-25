describe('Prototypes', function () {
	it('Should create an own property', function () {
		var proto = function () {};
		ko.utils.protoObservable(proto, "property");
		var instance = new proto();
		instance.property(); // We only expect the property to exist on the child object after it has been initialized by accessing it
		expect(instance.hasOwnProperty("property")).toEqual(true);
	});
	it('Should create unique observables for each intance', function () {
		var proto = function () {};
		ko.utils.protoObservable(proto, "property");
		var instance = new proto();
		var instance2 = new proto();
		instance.property("A");
		instance2.property("B");
		expect(instance.property()).toNotEqual(instance2.property());
		expect(instance.property()).toEqual("A");
		expect(instance2.property()).toEqual("B");
	});
	it('Should update computeds after changes', function () {
		var proto = function () {};
		ko.utils.protoObservable(proto, "property");
		ko.utils.protoComputed(proto, "computed", function () {
			return this.property() + 1;
		})
		var instance = new proto();
		instance.property(1);
		expect(instance.computed()).toEqual(2);
	});
	it('Should create distinct computeds', function () {
		var proto = function () {};
		ko.utils.protoObservable(proto, "property");
		ko.utils.protoComputed(proto, "computed", function () {
			return this.property() + 1;
		})
		var instance = new proto();
		var instance2 = new proto();

		instance.property(2);
		instance2.property(3);

		expect(instance.computed()).toNotEqual(instance2.computed());
		expect(instance.computed()).toEqual(3);
		expect(instance2.computed()).toEqual(4);
	});
	xit('Should create subscribable properties', function () {
		var proto = function () {};
		ko.utils.protoObservable(proto, "property");
		ko.utils.protoComputed(proto, "computed", function () {
			return this.property() + 1;
		})
		var instance = new proto();
		expect(ko.isSubscribable(instance.property)).toEqual(true);
		expect(ko.isSubscribable(instance.computed)).toEqual(true);
	});
});