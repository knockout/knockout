---
layout: documentation
title: Dependent Observables
---

Since Knockout 2.0, dependent observables are now called *computed observables*. You can find documentation for them [here](computedObservables.html).

Note that this rename does not cause any backward compatibility problems. At runtime, `ko.dependentObservable` refers to the same function as `ko.computed`, so your existing code will continue to work just fine.