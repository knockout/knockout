ko.extenders = {
    'throttle': function(target, options) {
        // Throttling means two things:

        // (1) For dependent observables, we throttle *evaluations* so that, no matter how fast its dependencies
        //     notify updates, the target doesn't re-evaluate (and hence doesn't notify) faster than a certain rate.
		//     By default, use "debounce" algorithm, which will limit evaluations until changes have stopped
		//     for a certain period of time. Optionally, "throttle" will re-evaluate at a specified rate.
		var throttleType = 'debounce',
			throttleRate = 0,
			throttleNoTrailingEval = false,
			writeTimeoutInstance = null,
			optionsValid;
		if (typeof options === 'number') {
			// For backwards compatibility with v2.3, allow numeric parameter and default to "debounce".
			throttleRate = options;
		}
		else {
			throttleType = options['type'];
			throttleRate = options['delay'];
			throttleNoTrailingEval = options['noTrailing'] === true;
		}
		
		// Validate parameters
		optionsValid = (
			throttleRate >= 0
			&& (throttleType === 'debounce'
				|| throttleType === 'throttle')
			);
		
		if (!optionsValid) {
			return target; // do not modify
		}
		else {
			// Add properties to be picked up by dependentObservable.js internals
			target['throttleType'] = throttleType;
			target['throttleEvaluation'] = throttleRate;
			target['throttleNoTrailing'] = throttleNoTrailingEval;
		}

        // (2) For writable targets (observables, or writable dependent observables), we throttle *writes*
        //     so the target cannot change value synchronously or faster than a certain rate
		if (ko.isWriteableObservable(target)) {
			return ko.dependentObservable({
				'read': target,
				'write': function(value) {
					// TODO: Apply "throttle" algorithm to writes, if desired. Currently uses "debounce"
					clearTimeout(writeTimeoutInstance);
					writeTimeoutInstance = setTimeout(function() {
						target(value);
					}, throttleRate);
				}
			});
		}
		else {
			// (3) For read-only targets, just return target to avoid overhead of wrapping in a new dependent observable.
			return target;
		}
    },

    'notify': function(target, notifyWhen) {
        target["equalityComparer"] = notifyWhen == "always" ?
            null :  // null equalityComparer means to always notify
            valuesArePrimitiveAndEqual;
    }
};

var primitiveTypes = { 'undefined':1, 'boolean':1, 'number':1, 'string':1 };
function valuesArePrimitiveAndEqual(a, b) {
    var oldValueIsPrimitive = (a === null) || (typeof(a) in primitiveTypes);
    return oldValueIsPrimitive ? (a === b) : false;
}

function applyExtenders(requestedExtenders) {
    var target = this;
    if (requestedExtenders) {
        ko.utils.objectForEach(requestedExtenders, function(key, value) {
            var extenderHandler = ko.extenders[key];
            if (typeof extenderHandler == 'function') {
                target = extenderHandler(target, value) || target;
            }
        });
    }
    return target;
}

ko.exportSymbol('extenders', ko.extenders);
