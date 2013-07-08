
describe('Extenders', function() {
    it('Should be able to extend any subscribable', function () {
        ko.extenders.setDummyProperty = function(target, value) {
            target.dummyProperty = value;
        };

        var subscribable = new ko.subscribable();
        expect(subscribable.dummyProperty).toEqual(undefined);

        subscribable.extend({ setDummyProperty : 123 });
        expect(subscribable.dummyProperty).toEqual(123);
    });

    it('Should be able to chain extenders', function() {
        ko.extenders.wrapInParentObject = function(target, value) {
            return { inner : target, extend : target.extend }
        };
        var underlyingSubscribable = new ko.subscribable();
        var result = underlyingSubscribable.extend({ wrapInParentObject:true }).extend({ wrapInParentObject:true });
        expect(result.inner.inner).toEqual(underlyingSubscribable);
    });
});
