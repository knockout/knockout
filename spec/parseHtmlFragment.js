var temporarilyRegisteredComponents = [];

describe('Parse HTML fragment', function() {
    beforeEach(jasmine.prepareTestNode);
    afterEach(function() {
        ko.utils.arrayForEach(temporarilyRegisteredComponents, function(componentName) {
            ko.components.unregister(componentName);
        });
        temporarilyRegisteredComponents = [];
    });

    // See: https://github.com/knockout/knockout/issues/1880
    ko.utils.arrayForEach(
    [
        { html: '<tr-component></tr-component>', parsed: ['<tr-component></tr-component>'] },
        { html: '<thead><tr><th><thcomponent>hello</thcomponent></th></tr></thead>', parsed: ['<thead><tr><th><thcomponent>hello</thcomponent></th></tr></thead>'], ignoreRedundantTBody: true },
        { html: '<tbody-component>world</tbody-component>', parsed: ['<tbody-component>world</tbody-component>'], minSupportedIEVersion: 8 },
        { html: '<tfoot-component>foo</tfoot-component>', parsed: ['<tfoot-component>foo</tfoot-component>'] },
        { html: '<div></div>', parsed: ['<div></div>'] },
        { html: '<custom-component></custom-component>', parsed: ['<custom-component></custom-component>'] },
        { html: '<tr></tr>', parsed: ['<tr></tr>'] },
        { html: '<tr></tr><tr></tr>', parsed: ['<tr></tr>', '<tr></tr>'] },
        { html: '<td></td>', parsed: ['<td></td>'] },
        { html: '<th></th>', parsed: ['<th></th>'] },
        { html: '<tbody></tbody>', parsed: ['<tbody></tbody>'] },
        { html: '<table><tbody></tbody></table>', parsed: ['<table><tbody></tbody></table>'] },
        { html: '<div></div><div></div>', parsed: ['<div></div>', '<div></div>'] },
        { html: '<optgroup label=x><option>text</option></optgroup>', parsed: ['<optgroup label=x><option>text</option></optgroup>'] },
        { html: '<option>text</option>', parsed: [ '<option>text</option>' ] },
        { html: '<colgroup><col></colgroup>', parsed: ['<colgroup><col></colgroup>'] },
        { html: '<col data-param>', parsed: ['<col data-param="">'] },
        { html: '<param>', parsed: ['<param>'] },
        { html: '<area>', parsed: ['<area>'] },
        { html: '<legend>lgt</legend>', parsed: ['<legend>lgt</legend>'] },
        { html: '<!-- z --><div>ct</div><!-- zz -->', parsed: ['<!-- z -->', '<div>ct</div>', '<!-- zz -->'] }
    ], function (data) {
        it('should parse ' + data.html + ' correctly', function () {
            // IE 6-8 has a lot of trouble with custom elements. We have several strategies for dealing with
            // this, each involving different (awkward) requirements for the application.
            // [1] If you use KO alone, then the document.createElement('my-element') hack is sufficient.
            //     However, most people don't use KO alone if they target IE 6-8 - typically they will use
            //     at least jQuery or innerShiv as well.
            // [2] If you use jQuery, then your custom elements must be preregistered as *KO components*
            //     before you make the browser parse any HTML containing them. Just document.createElement
            //     alone is not enough, because jQuery's HTML parsing runs in a separate document context.
            //     KO hooks into this especially for registered components.
            // [3] If you use innerShiv, then you have the same requirement as [2] (because innerShiv uses
            //     the same createDocumentFragment technique as jQuery), but additionally you cannot modify
            //     the set of custom elements after innerShiv runs for the first time, because innerShiv
            //     caches and reuses its document fragment. For this test, we deal with this by using a
            //     modified version of innerShiv that supports a 'reset' method. In production code, people
            //     should not use 'reset' like this - instead ensure that all custom elements are preregistered.
            // None of this mess affects other browsers.
            if (jasmine.ieVersion <= 8) {
                data.html.replace(/\<([a-z0-9\-]+)/g, function(ignored, foundTagName) {
                    if (!ko.components.isRegistered(foundTagName)) {
                        temporarilyRegisteredComponents.push(foundTagName);
                        ko.components.register(foundTagName, {});
                    }
                });

                if (window.innerShiv) {
                    window.innerShiv.reset();
                }

                // Out of all the combinations above, there is still one edge case we can't support without
                // dropping jQuery HTML parsing altogether. That is, if you're using jQuery, its parser fails
                // on elements named 'tbody-*', on IE 6 and 7 (but it works on IE 8+). This is such an extreme
                // edge case that it's preferable to leave this element name unsupported.
                if (jasmine.ieVersion < data.minSupportedIEVersion) {
                    return;
                }
            }

            var parsedNodes = ko.utils.parseHtmlFragment(data.html, document);

            // Normalise the output
            if (jasmine.ieVersion <= 8 && data.ignoreRedundantTBody) {
                if (parsedNodes[parsedNodes.length - 1].tagName === 'TBODY') {
                    // IE 7 adds a tbody tag; ignore it for the purpose of the test
                    parsedNodes.pop();
                }
            }

            // Assert that we have the expected collection of elements (not just the correct .innerHTML string)
            expect(parsedNodes.length).toEqual(data.parsed.length);
            for (var i = 0; i < parsedNodes.length; i++) {
                testNode.innerHTML = '';
                testNode.appendChild(parsedNodes[i]);
                expect(testNode).toContainHtml(data.parsed[i], function(htmlToClean) {
                    // Old IE strips quotes from certain attributes. The easiest way of normalising this across
                    // browsers is to forcibly strip the equivalent quotes in all browsers for the test.
                    return htmlToClean.replace(/"x"/g, 'x');
                });
            }
        });
    });

    it("returns copies of the nodes", function () {
        var html = '<div><i></i></div>';
        var parsedNodes1 = ko.utils.parseHtmlFragment(html, document);
        var parsedNodes2 = ko.utils.parseHtmlFragment(html, document);
        expect(parsedNodes1).toNotEqual(parsedNodes2);
        expect(parsedNodes1[0]).toNotEqual(parsedNodes2[0]);
        // We need to test for deep inequality
        expect(parsedNodes1[0].children[0]).toNotEqual(parsedNodes2[0].children[0]);
    })
});
