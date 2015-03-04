describe('onError handler', function () {
    var koOnErrorCount = 0;
    var windowOnErrorCount = 0;
    var windowOnErrorOrginal;

    beforeEach(function () {
        ko.onError = function (error) {
            koOnErrorCount++;
        };

        function ensureNodeExistsAndIsEmpty(id, tagName, type) {
            var existingNode = document.getElementById(id);
            if (existingNode != null)
                existingNode.parentNode.removeChild(existingNode);
            var resultNode = document.createElement(tagName || "div");
            resultNode.id = id;
            if (type)
                resultNode.setAttribute("type", type);
            document.body.appendChild(resultNode);
            return resultNode;
        }

        window.testDivTemplate = ensureNodeExistsAndIsEmpty("testDivTemplate");
        window.templateOutput = ensureNodeExistsAndIsEmpty("templateOutput");

        koOnErrorCount = 0;
        windowOnErrorCount = 0;

        windowOnErrorOrginal = window.onerror;

        window.onerror = function () {
            windowOnErrorCount++;
        };
    });

    afterEach(function () {
        window.onerror = windowOnErrorOrginal;
        ko.onError = null;
    });

    it('does not fire on sync errors', function () {
        window.testDivTemplate.innerHTML = "name: <div data-bind='text: name'></div>";

        var syncError = false;

        try {
            ko.renderTemplate("testDivTemplate", {
                name: ko.computed(function () {
                    return ERRORS_ON_PURPOSE = ERRORS_ON_PURPOSE2;
                })
            }, null, window.templateOutput);
        }
        catch (e) {
            syncError = true;
        }

        expect(syncError).toBe(true);

        expect(koOnErrorCount).toBe(0);
        expect(windowOnErrorCount).toBe(0);
    });

    it('fires on async component errors', function () {
        runs(function () {
            var component = {
                tagName: 'test-onerror',
                template: "<div data-bind='text: name'></div>",
                viewModel: function () {
                    this.name = ko.computed(function () {
                        return ERRORS_ON_PURPOSE = ERRORS_ON_PURPOSE2;
                    });
                }
            };

            if (!ko.components.isRegistered(component.tagName)) {
                ko.components.register(component.tagName, component);
            }

            window.testDivTemplate.innerHTML = "<test-onerror></test-onerror>";
            ko.renderTemplate("testDivTemplate", {
            }, null, window.templateOutput);
        });

        waitsFor(function () {
            return koOnErrorCount > 0 && windowOnErrorCount > 0;
        }, 'Error counts were not updated', 500);

        runs(function () {
            expect(koOnErrorCount).toBe(1);
            expect(windowOnErrorCount).toBe(1);
        });
    });
});
