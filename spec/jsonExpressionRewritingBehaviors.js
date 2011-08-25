
describe('JSON Expression Rewriting', {

    'Should be able to parse simple object literals': function() {
        var result = ko.jsonExpressionRewriting.parseObjectLiteral("a: 1, b: 2, \"quotedKey\": 3, 'aposQuotedKey': 4");
        value_of(result.length).should_be(4);
        value_of(result[0].key).should_be("a");
        value_of(result[0].value).should_be(" 1");
        value_of(result[1].key).should_be(" b");
        value_of(result[1].value).should_be(" 2");  
        value_of(result[2].key).should_be(" \"quotedKey\"");
        value_of(result[2].value).should_be(" 3");   
        value_of(result[3].key).should_be(" 'aposQuotedKey'");
        value_of(result[3].value).should_be(" 4");                         
    },

    'Should ignore any outer braces': function() {
        var result = ko.jsonExpressionRewriting.parseObjectLiteral("{a: 1}");
        value_of(result.length).should_be(1);
        value_of(result[0].key).should_be("a");
        value_of(result[0].value).should_be(" 1");        
    },

    'Should be able to parse object literals containing string literals': function() {
        var result = ko.jsonExpressionRewriting.parseObjectLiteral("a: \"comma, colon: brace{ bracket[ apos' escapedQuot\\\" end\", b: 'escapedApos\\\' brace} bracket] quot\"'");
        value_of(result.length).should_be(2);
        value_of(result[0].key).should_be("a");
        value_of(result[0].value).should_be(" \"comma, colon: brace{ bracket[ apos' escapedQuot\\\" end\"");
        value_of(result[1].key).should_be(" b");
        value_of(result[1].value).should_be(" 'escapedApos\\\' brace} bracket] quot\"'");        
    },    

    'Should be able to parse object literals containing child objects, arrays, function literals, and newlines': function() {
        var result = ko.jsonExpressionRewriting.parseObjectLiteral(
            "myObject : { someChild: { }, someChildArray: [1,2,3], \"quotedChildProp\": 'string value' },\n"
          + "someFn: function(a, b, c) { var regex = /}/; var str='/})({'; return {}; },"
          + "myArray : [{}, function() { }, \"my'Str\", 'my\"Str']"
        );
        value_of(result.length).should_be(3);
        value_of(result[0].key).should_be("myObject ");
        value_of(result[0].value).should_be(" { someChild: { }, someChildArray: [1,2,3], \"quotedChildProp\": 'string value' }");
        value_of(result[1].key).should_be("\nsomeFn");
        value_of(result[1].value).should_be(" function(a, b, c) { var regex = /}/; var str='/})({'; return {}; }");
        value_of(result[2].key).should_be("myArray ");
        value_of(result[2].value).should_be(" [{}, function() { }, \"my'Str\", 'my\"Str']");
    },

    'Should be able to cope with malformed syntax (things that aren\'t key-value pairs)': function() {
        var result = ko.jsonExpressionRewriting.parseObjectLiteral("malformed1, 'mal:formed2', good:3, { malformed: 4 }");
        value_of(result.length).should_be(4);
        value_of(result[0].unknown).should_be("malformed1");
        value_of(result[1].unknown).should_be(" 'mal:formed2'");
        value_of(result[2].key).should_be(" good");
        value_of(result[2].value).should_be("3");
        value_of(result[3].unknown).should_be(" { malformed: 4 }");
    },

    'Should ensure all keys are wrapped in quotes': function() {
        var rewritten = ko.jsonExpressionRewriting.insertPropertyAccessorsIntoJson("a: 1, 'b': 2, \"c\": 3");
        value_of(rewritten).should_be("'a': 1, 'b': 2, \"c\": 3");
    },

    'Should convert JSON values to property accessors': function () {
        var rewritten = ko.jsonExpressionRewriting.insertPropertyAccessorsIntoJson('a : 1, b : firstName, c : function() { return "returnValue"; }');

        var model = { firstName: "bob", lastName: "smith" };
        with (model) {
            var parsedRewritten = eval("({" + rewritten + "})");
            value_of(parsedRewritten.a).should_be(1);
            value_of(parsedRewritten.b).should_be("bob");
            value_of(parsedRewritten.c()).should_be("returnValue");

            parsedRewritten._ko_property_writers.b("bob2");
            value_of(model.firstName).should_be("bob2");
        }
    },

    'Should be able to eval rewritten literals that contain unquoted keywords as keys': function() {
        var rewritten = ko.jsonExpressionRewriting.insertPropertyAccessorsIntoJson("if: true");
        value_of(rewritten).should_be("'if': true");
        var evaluated = eval("({" + rewritten + "})");
        value_of(evaluated['if']).should_be(true);
    }
});