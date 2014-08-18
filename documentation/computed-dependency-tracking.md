---
layout: documentation
title: How dependency tracking works
---

*Beginners don't need to know about this, but more advanced developers will want to know why we keep making all these claims about KO automatically tracking dependencies and updating the right parts of the UI...*

It's actually very simple and rather lovely. The tracking algorithm goes like this:

1. Whenever you declare a computed observable, KO immediately invokes its evaluator function to get its initial value.
1. While the evaluator function is running, KO sets up a subscription to any observables (including other computed observables) that the evaluator reads. The subscription callback is set to cause the evaluator to run again, looping the whole process back to step 1 (disposing of any old subscriptions that no longer apply).
1. KO notifies any subscribers about the new value of your computed observable.

So, Knockout doesn't just detect dependencies the first time the evaluator runs - it redetects them every time. This means, for example, that the dependencies can vary dynamically: dependency A could determine whether the computed observable also depend on B or C. Then, it will only be re-evaluated when either A or your current choice of B or C changes. You don't have to declare dependencies: they're determined at runtime from the code's execution.

The other neat trick is that declarative bindings are simply implemented as computed observables. So, if a binding reads the value of an observable, that binding becomes dependent on that observable, which causes that binding to be re-evaluated if the observable changes.

*Pure* computed observables work slightly differently. For more details, see the documentation for [*pure* computed observables](computed-pure.html).

### Controlling dependencies using peek

Knockout's automatic dependency tracking normally does exactly what you want. But you might sometimes need to control which observables will update your computed observable, especially if the computed observable performs some sort of action, such as making an Ajax request. The `peek` function lets you access an observable or computed observable without creating a dependency.

In the example below, a computed observable is used to reload an observable named `currentPageData` using Ajax with data from two other observable properties. The computed observable will update whenever `pageIndex` changes, but it ignores changes to `selectedItem` because it is accessed using `peek`. In this case, the user might want to use the current value of `selectedItem` only for tracking purposes when a new set of data is loaded.

    ko.computed(function() {
        var params = {
            page: this.pageIndex(),
            selected: this.selectedItem.peek()
        };
        $.getJSON('/Some/Json/Service', params, this.currentPageData);
    }, this);

Note: If you just want to prevent a computed observable from updating too often, see the [`rateLimit` extender](rateLimit-observable.html).

### Note: Why circular dependencies aren't meaningful

Computed observables are supposed to map a set of observable inputs into a single observable output. As such, it doesn't make sense to include cycles in your dependency chains. Cycles would *not* be analogous to recursion; they would be analogous to having two spreadsheet cells that are computed as functions of each other. It would lead to an infinite evaluation loop.

So what does Knockout do if you have a cycle in your dependency graph? It avoids infinite loops by enforcing the following rule: **Knockout will not restart evaluation of a computed while it is already evaluating**. This is very unlikely to affect your code. It's relevant in two situations: when two computed observables are dependent on each other (possible only if one or both use the `deferEvaluation` option), or when a computed observable writes to another observable on which it has a dependency (either directly or via a dependency chain). If you need to use one of these patterns and want to entirely avoid the circular dependency, you can use the `peek` function described above.
