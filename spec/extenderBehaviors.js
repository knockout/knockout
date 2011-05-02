
describe('Extenders', {
    'Should be able to extend any subscribable': function () {
        ko.extenders.setDummyProperty = function(target, value) {
            target.dummyProperty = value;
        };
        
        var subscribable = new ko.subscribable();
        value_of(subscribable.dummyProperty).should_be(undefined);
        
        subscribable.extend({ setDummyProperty : 123 });
        value_of(subscribable.dummyProperty).should_be(123);
    },
    
    'Should be able to chain extenders': function() {
        ko.extenders.wrapInParentObject = function(target, value) {
            return { inner : target, extend : target.extend }
        };
        var underlyingSubscribable = new ko.subscribable();
        var result = underlyingSubscribable.extend({ wrapInParentObject:true }).extend({ wrapInParentObject:true });
        value_of(result.inner.inner).should_be(underlyingSubscribable);
    }
});