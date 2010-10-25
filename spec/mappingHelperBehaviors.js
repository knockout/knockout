
describe('Mapping helpers', {    
    'ko.fromJS should require a parameter': function() {
        var didThrow = false;
        try { ko.fromJS() }
        catch(ex) { didThow = true }    	
        value_of(didThow).should_be(true);
    },
    
    'ko.fromJS should return an observable': function() {
        var result = ko.fromJS({});
        value_of(ko.isObservable(result)).should_be(true);
    },
    
    'ko.fromJS should map the top-level properties on the supplied object as observables': function() {
        var result = ko.fromJS({ a : 123, b : 'Hello', c : true });
        value_of(ko.isObservable(result().a)).should_be(true);
        value_of(ko.isObservable(result().b)).should_be(true);
        value_of(ko.isObservable(result().c)).should_be(true);
        value_of(result().a()).should_be(123);
        value_of(result().b()).should_be('Hello');
        value_of(result().c()).should_be(true);
    },
    
    'ko.fromJS should map descendant properties on the supplied object as observables': function() {
        var result = ko.fromJS({ 
            a : { 
                a1 : 'a1value',
                a2 : {
                    a21 : 'a21value',
                    a22 : 'a22value'
                }
            }, 
            b : { b1 : null, b2 : undefined }
        });
        value_of(result().a().a1()).should_be('a1value');
        value_of(result().a().a2().a21()).should_be('a21value');
        value_of(result().a().a2().a22()).should_be('a22value');
        value_of(result().b().b1()).should_be(null);
        value_of(result().b().b2()).should_be(undefined);
    },
    
    'ko.fromJS should map observable properties, but without adding a further observable wrapper': function() {
        var result = ko.fromJS({ a : ko.observable('Hey') });
        value_of(result().a()).should_be('Hey');    	
    },
    
    'ko.fromJS should map arrays as observableArrays': function() {
        var result1 = ko.fromJS([ 1, 'a', true]);
        value_of(result1().length).should_be(3);
        value_of(result1()[1]()).should_be('a');
        value_of(typeof result1.destroyAll).should_be('function'); // Just an example of a function on ko.observableArray but not on Array
    },
    
    'ko.fromJS should escape from reference cycles': function() {
        var obj = {};
        obj.someProp = { owner : obj };
        var result = ko.fromJS(obj);
        value_of(result().someProp().owner).should_be(result);
    }
})