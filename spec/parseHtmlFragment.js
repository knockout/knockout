describe('Parse HTML fragment', function() {
    beforeEach(jasmine.prepareTestNode);

    ko.utils.arrayForEach(
    [
        { html: '<tr-component></tr-component>', parsed: ['<tr-component></tr-component>'] },
        { html: '<thead><tr><th><thcomponent>hello</thcomponent></th></tr></thead>', parsed: ['<thead><tr><th><thcomponent>hello</thcomponent></th></tr></thead>'], ignoreRedundantTBody: true },
        { html: '<tbody-component>world</tbody-component>', parsed: ['<tbody-component>world</tbody-component>'] },
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
        { html: '<option>text</option>', parsed: [ '<option>text</option>' ] }
    ], function (data) {
        it('should parse ' + data.html + ' correctly', function () {
            // For this test to be valid on IE6-8, we need any custom elements to be preregistered
            // This is a general requirement for using custom elements on IE6-8, for KO or any other library
            if (jasmine.ieVersion <= 8) {
                data.html.replace(/\<([^\s\>]+)/g, function(ignored, foundTagName) {
                    document.createElement(foundTagName);
                });
            }

            var parsedNodes = ko.utils.parseHtmlFragment(data.html, document);

            // Normalise the output
            if (jasmine.ieVersion <= 8 && data.ignoreRedundantTBody) {
                if (parsedNodes[parsedNodes.length - 1].tagName === "TBODY") {
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
});
