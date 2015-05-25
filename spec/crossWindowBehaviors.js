describe('Cross-window support', function() {

    it('Should work in another window', function () {
        var win2 = window.open("blank.html", "_blank", "height=150,location=no,menubar=no,toolbar=no,width=250"),
            body2;

        if (win2) {
            this.after(function() {
                win2.close();
            });

            waitsFor(function () {
                return (win2.document && win2.document.readyState == 'complete' && (body2 = win2.document.body));
            }, 5000);

            runs(function () {
                ko.setTemplateEngine(new dummyTemplateEngine({ someTemplate: "<div data-bind='text: text'></div>" }));
                ko.renderTemplate("someTemplate", { text: 'abc' }, null, body2);
                expect(body2.childNodes.length).toEqual(1);
                expect(body2).toContainHtml("<div>abc</div>");
                ko.cleanNode(body2);
            });

            runs(function () {
                body2.innerHTML = "<div data-bind='foreach: someItems'><span data-bind='text: childProp'></span></div>";
                var someItems = [
                    { childProp: 'first child' },
                    { childProp: 'second child' }
                ];
                ko.applyBindings({ someItems: someItems }, body2);
                expect(body2.childNodes[0]).toContainHtml('<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span>');
                ko.cleanNode(body2);
            });

            runs(function () {
                var someItem = ko.observable(undefined);
                body2.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: occasionallyExistentChildProp'></span></div>";
                ko.applyBindings({ someItem: someItem }, body2);

                // First it's not there
                expect(body2.childNodes[0].childNodes.length).toEqual(0);

                // Then it's there
                someItem({ occasionallyExistentChildProp: 'Child prop value' });
                expect(body2.childNodes[0].childNodes.length).toEqual(1);
                expect(body2.childNodes[0].childNodes[0]).toContainText("Child prop value");

                // Then it's gone again
                someItem(null);
                expect(body2.childNodes[0].childNodes.length).toEqual(0);
                ko.cleanNode(body2);
            });
        }
    });
});
