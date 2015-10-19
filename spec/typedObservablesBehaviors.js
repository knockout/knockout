describe('ObservableBool', function() {
  it('Should be instanciated with value false by default', function () {
    var noValueInstance = ko.observableBool(),
        falseValueInstance = ko.observableBool(false),
        wrongValueInstance = ko.observableBool('a wrong value');

    expect(noValueInstance()).toEqual(false);
    expect(falseValueInstance()).toEqual(false);
    expect(wrongValueInstance()).toEqual(false);
  });

  it('Should be toggelable', function () {
    var instance = ko.observableBool(false);
    instance.toggle();
    expect(instance()).toEqual(true);
  });

  it('Should normalize setValues', function() {
    var instance = ko.observableBool(true);

    // check none-bool value
    instance("value that will be normalized to false");
    expect(instance()).toEqual(false);

    // check every value that should be normalized to true (reset)
    instance(true);
    expect(instance()).toEqual(true);

    instance(false); // reset
    instance(1);
    expect(instance()).toEqual(true);

    instance(false); // reset
    instance("1");
    expect(instance()).toEqual(true);
  });
});

describe('ObservableNumber', function() {
  it('Incremention / Decremention should work', function() {
    var instance = ko.observableNumber(13);
    instance.increment();
    expect(instance()).toEqual(14);
    instance.decrement();
    expect(instance()).toEqual(13);
  });

  it('Abs / Positive / Negative dynamic attribute should work', function() {
    var instance = ko.observableNumber(13);
    expect(instance.abs()).toEqual(13);
    expect(instance.negative()).toEqual(false);
    expect(instance.positive()).toEqual(true);

    instance(-13);
    expect(instance.abs()).toEqual(13);
    expect(instance.negative()).toEqual(true);
    expect(instance.positive()).toEqual(false);
  });
});

describe('ObservableInt', function() {
  it('Should inherit all methods and attributes from Number', function() {
    var instance = ko.observableInt(13);
    instance.increment(); // proto method
    expect(instance()).toEqual(14);
    expect(instance.positive()).toEqual(true); // dynamic attribute
  });

  it('Hex dynamic attribute should work', function() {
    var instance = ko.observableInt(25);
    expect(instance.hex()).toEqual('19'); // Test getter

    instance.hex('4dd'); // Test setter
    expect(instance()).toEqual(1245);
  });
});
