ko.utils.protoObservable = function (proto, property) {
	var args = Array.prototype.slice.call(arguments, 2);
	var factory = proto.prototype[property] = function () {
		factory.lazyInit(this);
		return this[property].apply(this, arguments);
	};
	factory.lazyInit = function (self) {
		if (!self.hasOwnProperty(property)) self[property] = ko.observable.apply(ko, args);
	}
	factory.subscribe = function () {
		throw new Error("protoObservable & protoComputed don't support subscribe before the subscribable has been initialized. Try adding this._ko_init() to your constructor.");
	}

	factory.notifySubscribers = function () {
		throw new Error("protoObservable & protoComputed don't support notifySubscribers before the subscribable has been initialized. Try adding this._ko_init() to your constructor.");
	}
	return factory;
};

ko.utils.protoComputed = function (proto, property) {
	var args = Array.prototype.slice.call(arguments, 2);
	var factory = proto.prototype[property] = function () {
		factory.lazyInit(this);
		return this[property].apply(this, arguments);
	};
	factory.lazyInit = function (self) {
		if (!self.hasOwnProperty(property)) self[property] = ko.computed.apply(ko, args.concat([self]));
	}
	factory.subscribe = function () {
		throw new Error("protoObservable & protoComputed don't support subscribe before the subscribable has been initialized. Try adding this._ko_init() to your constructor.");
	}

	factory.notifySubscribers = function () {
		throw new Error("protoObservable & protoComputed don't support notifySubscribers before the subscribable has been initialized. Try adding this._ko_init() to your constructor.");
	}
	return factory;
};