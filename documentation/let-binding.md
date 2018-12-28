---
layout: documentation
title: The "let" binding
---

### Purpose
The `let` binding lets you set custom [binding context](binding-context.html) properties that you can then reference in the bindings of all descendant elements.

### Example

Here is a basic example of setting values using `let` that are then available in all descendant elements, regardless of context changes.

    <!--ko let: {inventory: {suppliers: suppliers, bins: bins}, calculatedDisplay: someCalculation}-->
        <div data-bind="foreach: {data: inventory.suppliers, as: 'supplier'}>
            <div data-bind="foreach: {data: inventory.bins, as: 'bin'}">
                <span data-bind="text: calculatedDisplay(supplier, bin)>
            </div>
        </div>
    <!--/ko-->

    <script type="text/javascript">
        ko.applyBindings({
            suppliers: [...],
            bins: [...],
            someCalculation: function (supplier, bin) {
                /* return some calculated value based on parameters */
            }
        });
    </script>

### Parameters

  * Main parameter

    A JavaScript object whose properties will be copied to the binding context for descendant elements.
    
    If the expression you supply unwraps any observable values, the expression will be re-evaluated whenever any of those observables change. Additionally, the bindings for all descendant elements will be re-evaluated as well.

  * Additional parameters

     * None

### Note 1: Using "let" without a container element

Just like other control flow bindings, you can use `let` without any container element to host it. See the documentation for [`if`](if-binding.html) or [`foreach`](foreach-binding.html) for more details.

### Note 2: Performance considerations when using "let"

If the expression you provide to the `let` binding unwraps any observables, each descendant binding will include an additional dependency on the `let` binding. This is true whether or not the binding references any of the custom context properties. If you want to make an observable value available through `let`, it is generally better to set the observable itself rather than unwrap it and set the value.

### Dependencies

None, other than the core Knockout library.