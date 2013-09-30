describe('Node preprocessing', function() {
    beforeEach(jasmine.prepareTestNode);

    beforeEach(function() {
        this.restoreAfter(ko.bindingProvider, 'instance');

        var preprocessingBindingProvider = function() { };
        preprocessingBindingProvider.prototype = ko.bindingProvider.instance;
        ko.bindingProvider.instance = new preprocessingBindingProvider();
    });

    it('Can leave the nodes unchanged by returning a falsey value', function() {
        ko.bindingProvider.instance.preprocessNode = function(node) { return null; };
        testNode.innerHTML = "<p data-bind='text: someValue'></p>";
        ko.applyBindings({ someValue: 'hello' }, testNode);
        expect(testNode).toContainText('hello');
    });

    it('Can replace a node with some other node', function() {
        ko.bindingProvider.instance.preprocessNode = function(node) {
            // Example: replace <mySpecialNode /> with <span data-bind='text: someValue'></span>
            // This technique could be the basis for implementing custom element types that render templates
            if (node.tagName && node.tagName.toLowerCase() === 'myspecialnode') {
                var newNode = document.createElement("span");
                newNode.setAttribute("data-bind", "text: someValue");
                node.parentNode.insertBefore(newNode, node);
                node.parentNode.removeChild(node);
                return [newNode];
            }
        };
        testNode.innerHTML = "<span>a</span><mySpecialNode></mySpecialNode><span>b</span>";
        var someValue = ko.observable('hello');
        ko.applyBindings({ someValue: someValue }, testNode);
        expect(testNode).toContainText('ahellob');

        // Check that updating the observable has the expected effect
        someValue('goodbye');
        expect(testNode).toContainText('agoodbyeb');
    });

    it('Can replace a node with multiple new nodes', function() {
        ko.bindingProvider.instance.preprocessNode = function(node) {
            // Example: Replace {{ someValue }} with text from that property.
            // This could be generalized to full support for string interpolation in text nodes.
            if (node.nodeType === 3 && node.data.indexOf("{{ someValue }}") >= 0) {
                var prefix = node.data.substring(0, node.data.indexOf("{{ someValue }}")),
                    suffix = node.data.substring(node.data.indexOf("{{ someValue }}") + "{{ someValue }}".length),
                    newNodes = [
                        document.createTextNode(prefix),
                        document.createComment("ko text: someValue"),
                        document.createComment("/ko"),
                        document.createTextNode(suffix)
                    ];
                // Manually reimplement ko.utils.replaceDomNodes, since it's not available in minified build
                for (var i = 0; i < newNodes.length; i++) {
                    node.parentNode.insertBefore(newNodes[i], node);
                }
                node.parentNode.removeChild(node);
                return newNodes;
            }
        };
        testNode.innerHTML = "the value is {{ someValue }}.";
        var someValue = ko.observable('hello');
        ko.applyBindings({ someValue: someValue }, testNode);
        expect(testNode).toContainText('the value is hello.');

        // Check that updating the observable has the expected effect
        someValue('goodbye');
        expect(testNode).toContainText('the value is goodbye.');
    });

    it('Can modify the set of top-level nodes in a foreach loop', function() {
        ko.bindingProvider.instance.preprocessNode = function(node) {
            // Replace <data /> with <span data-bind="text: $data"></span>
            if (node.tagName && node.tagName.toLowerCase() === "data") {
                var newNode = document.createElement("span");
                newNode.setAttribute("data-bind", "text: $data");
                node.parentNode.insertBefore(newNode, node);
                node.parentNode.removeChild(node);
                return [newNode];
            }

            // Delete any <button> elements
            if (node.tagName && node.tagName.toLowerCase() === "button") {
                node.parentNode.removeChild(node);
                return [];
            }
        };
        testNode.innerHTML = "<div data-bind='foreach: items'>"
                               + "<button>DeleteMe</button>"
                               + "<data></data>"
                               + "<!-- ko text: $data --><!-- /ko -->"
                               + "<button>DeleteMe</button>" // Tests that we can remove the last node even when the preceding node is a virtual element rather than a single node
                           + "</div>";
        var items = ko.observableArray(["Alpha", "Beta"]);

        ko.applyBindings({ items: items }, testNode);
        expect(testNode).toContainText('AlphaAlphaBetaBeta');

        // Check that modifying the observable array has the expected effect
        items.splice(0, 1);
        expect(testNode).toContainText('BetaBeta');
        items.push('Gamma');
        expect(testNode).toContainText('BetaBetaGammaGamma');
    });
});
