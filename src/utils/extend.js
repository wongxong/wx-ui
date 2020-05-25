import { isArray, isObject, isPlainObject, isFunction } from './util';

export default function extend() {
  var target = arguments[0] || {};
  var length = arguments.length;
  var i = 1;
  var argItem;
  var key;
  var src;
  var copy;
  var copyIsArray = false;
  var clone;

  if(!isObject(target) && !isFunction(target)) {
    target = {};
  }

  for(i = 1; i < length; i++) {
    if((argItem = arguments[i]) != null) {
      for(key in argItem) {
        src = target[key];
        copy = argItem[key];

        if(key === '__proto__' || copy === target || src === copy) {
					continue;
        }

        if(copy && ((copyIsArray = isArray(copy)) || isPlainObject(copy))) {
          if(copyIsArray) {
            copyIsArray = false;

            clone = src && isArray(src) ? src : [];
          } else {
            clone = src && isPlainObject(src) ? src : {};
          }

          target[key] = extend(clone, copy);
        } else if(typeof copy !== 'undefined') {
          target[key] = copy;
        }
      }
    }
  }

  return target;
}