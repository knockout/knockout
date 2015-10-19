// Generator
ko.registerType = function(name, options) {
  var rawType = 'observable' + (options['extends'] || ''),
      normalize = options.normalize || function(value) { return value; },
      typedObservable = function(initialValue) {
        var raw = ko[rawType](normalize(initialValue)),
            wrapper = ko.pureComputed({
              read: raw,
              write: function(value) {
                raw(normalize(value));
              }
            });

        // apply super attributes (prototype methods and dyn attributes)
        if (rawType !== 'observable')
          for (var attr in raw)
            if (!wrapper[attr]) wrapper[attr] = raw[attr];

        // TODO: Validate name conflicts in debug build
        for (var method in options['prototypeMethods']) { // jshint ignore: line
          wrapper[method] = (function(method) {
            return function() { method.call(raw, arguments); };
          })(options['prototypeMethods'][method]); // jshint ignore: line
        }

        for (var attribute in options['dynamicAttributes']) { // jshint ignore: line
          wrapper[attribute] = ko.pureComputed(options['dynamicAttributes'][attribute], raw); // jshint ignore: line
        }

        return wrapper;
      };

  ko['observable' + name] = typedObservable;
  ko.exportSymbol('observable' + name, typedObservable);
};

ko.exportSymbol('registerType', ko.registerType);

// Register core types
ko.registerType('Bool', {
  normalize: function(value) { return value == true }, // jshint ignore: line
  'prototypeMethods': {
    'toggle': function() {
      this(!this());
    }
  }
});

ko.registerType('Number', {
  normalize: function(value) { return parseFloat(value) || 0; },
  'prototypeMethods': {
    'increment': function() {
      this(this() + 1);
    },
    'decrement': function() {
      this(this() - 1);
    }
  },
  'dynamicAttributes': {
    'abs': function() {
      return Math.abs(this());
    },
    'negative': function() {
      return this() < 0;
    },
    'positive': function() {
      return this() >= 0;
    }
  }
});

ko.registerType('Int', {
  normalize: function(value) { return parseInt(value); },
  extends: 'Number',
  'dynamicAttributes': {
    'hex': {
      'read': function() {
        return this().toString(16);
      },
      'write': function(newValue) {
        this(parseInt(newValue, 16));
      }
    }
  }
});
