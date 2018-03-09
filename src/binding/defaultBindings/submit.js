ko.bindingHandlers['submit'] = {
    'init': function (element, valueAccessor, allBindings, viewModel, bindingContext) {

        ko.utils.registerEventHandler(element, "submit", function (event) {
            var handlerReturnValue;
            var handlerFunction = valueAccessor();
            if (handlerFunction !== null && handlerFunction !== undefined && typeof handlerFunction !== "function") {
                throw new Error("The value for a 'submit' binding must be a function");
            }

            if (!handlerFunction)
                return;

            try {
                // Take all the event args, and prefix with the viewmodel
                var argsForHandler = ko.utils.makeArray(arguments);
                viewModel = bindingContext['$data'];
                argsForHandler.unshift(element);
                handlerReturnValue = handlerFunction.apply(viewModel, argsForHandler);
            } finally {
                if (handlerReturnValue !== true) { // Normally we want to prevent default action. Developer can override this be explicitly returning true.
                    if (event.preventDefault)
                        event.preventDefault();
                    else
                        event.returnValue = false;
                }
            }

            var bubble = allBindings.get('submitBubble') !== false && handlerReturnValue !== false;
            if (!bubble) {
                event.cancelBubble = true;
                if (event.stopPropagation)
                    event.stopPropagation();
            }
        });
    }
};
