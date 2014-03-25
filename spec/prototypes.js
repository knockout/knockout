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
	it('Should throw a readable error if invalid proto is passed');
	it('Should create subscribable properties', function () {
		var proto = function () {};
		ko.utils.protoObservable(proto, "property");
		ko.utils.protoComputed(proto, "computed", function () {
			return this.property() + 1;
		})
		var instance = new proto();
		expect(ko.isSubscribable(instance.property)).toEqual(true);
		expect(ko.isSubscribable(instance.computed)).toEqual(true);
	});
	it("Should run create _ko_init on prototype", function () {
		var proto = function () {};
		ko.utils.protoObservable(proto, "property");
		expect(typeof proto.prototype._ko_init).toEqual("function");
	});
	it("Should initialize all observables on _ko_init", function () {
		var proto = function () {
			this._ko_init();
		};
		ko.utils.protoObservable(proto, "property");
		ko.utils.protoObservable(proto, "property2");
		var instance = new proto();
		expect(instance.property).toNotEqual(proto.prototype.property);
		expect(instance.property2).toNotEqual(proto.prototype.property2);
	});
	it("Should create distinct subscriptions for observables", function () {
		var proto = function () {
			this._ko_init();
		};
		ko.utils.protoObservable(proto, "property");
		ko.utils.protoObservable(proto, "property2");
		var instance = new proto();
		var valA, valB;
		instance.property.subscribe(function (val) {
			valA = val;
		});
		instance.property2.subscribe(function (val) {
			valB = val;
		});
		instance.property("A");
		instance.property2("B");
		expect(valA).toEqual(instance.property());
		expect(valB).toEqual(instance.property2());
		expect(valA).toEqual("A");
		expect(valB).toEqual("B");
	});
	it("Should create distinct subscriptions for computeds", function () {
		var proto = function () {
			this._ko_init();
		};
		ko.utils.protoObservable(proto, "property");
		ko.utils.protoObservable(proto, "property2");
		ko.utils.protoComputed(proto, "computed", function () {
			return this.property();
		});
		ko.utils.protoComputed(proto, "computed2", function () {
			return this.property2();
		});
		var instance = new proto();
		var valA, valB;
		instance.computed.subscribe(function (val) {
			valA = val;
		});
		instance.computed2.subscribe(function (val) {
			valB = val;
		});
		instance.property("A");
		instance.property2("B");
		expect(valA).toEqual(instance.property());
		expect(valB).toEqual(instance.property2());
		expect(valA).toEqual("A");
		expect(valB).toEqual("B");
	});
});