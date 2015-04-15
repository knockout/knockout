describe('Parse HTML fragment', function() {
    [
        { html: '<tr-component></tr-component>', parsed: ['<tr-component></tr-component>'] },
        { html: '<thead><tr><th><thcomponent>Hello</thcomponent></th></tr></thead>', parsed: ['<thead><tr><th><thcomponent>Hello</thcomponent></th></tr></thead>'] },
        { html: '<tbody-component>World</tbody-component>', parsed: ['<tbody-component>World</tbody-component>'] },
        { html: '<tfoot-component>foo</tfoot-component>', parsed: ['<tfoot-component>foo</tfoot-component>'] },
        { html: '<div></div>', parsed: ['<div></div>'] },
        { html: '<custom></custom>', parsed: ['<custom></custom>'] },
        { html: '<tr></tr>', parsed: ['<tr></tr>'] },
        { html: '<tr></tr><tr></tr>', parsed: ['<tr></tr>', '<tr></tr>'] },
        { html: '<td></td>', parsed: ['<td></td>'] },
        { html: '<th></th>', parsed: ['<th></th>'] },
        { html: '<tbody></tbody>', parsed: ['<tbody></tbody>'] },
        { html: '<table><tbody></tbody></table>', parsed: ['<table><tbody></tbody></table>'] },
        { html: '<div></div><div></div>', parsed: ['<div></div>', '<div></div>'] }
    ].forEach(function (data) {
        it('should parse ' + data.html + ' correctly', function () {
            var parsed = ko.utils.parseHtmlFragment(data.html, document);
            expect(ko.utils.arrayMap(parsed, function (element) {
                return element.outerHTML;
            })).toEqual(data.parsed);
        });
    });
});
