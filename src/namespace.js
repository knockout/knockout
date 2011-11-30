var globalRoot,
    ko;

if (typeof exports !== 'undefined') {
  globalRoot = global;
} else {
  globalRoot = window;
}

ko = globalRoot['ko'] = {};
