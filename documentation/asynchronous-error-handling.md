---
layout: documentation
title: Asynchronous error handling
---

*Note: This documentation applies to Knockout 3.4.0 and later.*

## ko.onError

Knockout wraps internal asynchronous calls and looks for an optional `ko.onError` callback to execute, if an exception is encountered, before throwing the original error. This gives you the opportunity to run custom logic, such as passing the error to a logging module. Additionally, since the original call is wrapped in a try/catch, the error passed to `ko.onError` contains a `stack` property, which is not true in many browsers when handling errors using `window.onerror`.

This functionality applies to errors in the following contexts:

- asynchronous updates made as part of the `textInput` and `value` binding
- component loading of a cached component when not configured for [synchronous loading](component-registration.html#controlling-synchronousasynchronous-loading)
- [rate-limited](rateLimit-observable.html) and [throttled](throttle-extender.html) computeds
- event handlers added by `ko.utils.registerEventHandler` including those bound by the `event` and `click` bindings

## Example
    ko.onError = function(error) {
        myLogger("knockout error", error);
    };
