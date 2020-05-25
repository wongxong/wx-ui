import { cached, isPlainObject, isString, isFunction, isObject, once } from './util';
import { on, off, getComputedCSS, addClass, removeClass } from './dom';
import extend from './extend';

const autoCssTransition = cached(name => {
  return {
    enterClass: `${ name }-enter`,
    enterToClass: `${ name }-enter-to`,
    enterActiveClass: `${ name }-enter-active`,
    leaveClass: `${ name }-leave`,
    leaveToClass: `${ name }-leave-to`,
    leaveActiveClass: `${ name }-leave-active`
  };
});

function resolveTransition(data) {
  if(!data) return;

  let res = {};

  if(isPlainObject(data)) {
    if(data.css !== false) {
      res = autoCssTransition(data.name || 'wx');
    }
  } else if(isString(data)) {
    res = autoCssTransition(data);
  }

  return extend(res, data);
}

export const inBrowser = !!window;
export const isIE9 = inBrowser && window.navigator.userAgent.indexOf('MSIE 9.0') > -1;

const hasTransition = inBrowser && !isIE9;
const TRANSITION = 'transition';
const ANIMATIOIN = 'animation';
let transitionEndEvent = 'transitionend';
let animationEndEvent = 'animationend';
let transitionProp = 'transition';
let animationProp = 'animation';

if(hasTransition) {
  if(window.ontransitionend === undefined && window.onwebkittransitionend !== undefined) {
    transitionProp = 'WebkitTransition';
    transitionEndEvent = 'WebkitTransitionEnd';
  }
  if(window.onanimationend === undefined && window.onwebkitanimationend !== undefined) {
    animationProp = 'WebkitAnimation';
    animationEndEvent = 'WebkitAnimationEnd';
  }
}

const raf = inBrowser 
  ? ( window.requestAnimationFrame
    ? window.requestAnimationFrame
    : setTimeout )
  : function(fn) { return fn() };

export function nextFrame(fn) {
  raf(function() {
    raf(fn);
  });
}

export function whenTransitionEnds(el, expectedType, cb) {
  const {
    type,
    timeout,
    propCount
  } = getTransitionInfo(el, expectedType);

  if(!type) {
    return cb();
  }

  const evt = type === TRANSITION ? transitionEndEvent : animationEndEvent;
  let ended = 0;
  const end = function() {
    off(el, evt, onEnd);
    cb();
  };
  const onEnd = function(e) {
    if(e.target === el) {
      if(++ended >= propCount) {
        end();
      }
    }
  };

  setTimeout(() => {
    if(ended < propCount) {
      end();
    }
  }, timeout + 1);
  on(el, evt, onEnd);
}

function getTransitionInfo(el, expectedType) {
  const styles = getComputedCSS(el);
  // JSDOM may return undefined for transition properties
  const transitionDelays = (styles[transitionProp + 'Delay'] || '').split(', ');
  const transitionDurations = (styles[transitionProp + 'Duration'] || '').split(', ');
  const transitionTimeout = getTimeout(transitionDelays, transitionDurations);
  const animationDelays = (styles[animationProp + 'Delay'] || '').split(', ');
  const animationDurations = (styles[animationProp + 'Duration'] || '').split(', ');
  const animationTimeout = getTimeout(animationDelays, animationDurations);

  let type;
  let timeout = 0;
  let propCount = 0;

  if(expectedType === TRANSITION) {
    if(transitionTimeout > 0) {
      type = TRANSITION;
      timeout = transitionTimeout;
      propCount = transitionDurations.length;
    }
  } else if(expectedType === ANIMATIOIN) {
    if(animationTimeout > 0) {
      type = ANIMATIOIN;
      timeout = animationTimeout;
      propCount = animationDurations.length;
    }
  } else {
    timeout = Math.max(transitionTimeout, animationTimeout);
    type = timeout > 0 ? ( transitionTimeout > animationTimeout 
        ? TRANSITION : ANIMATIOIN ) 
      : null;
    propCount = type ? ( type === TRANSITION
        ? transitionDurations.length : animationDurations.length )
      : 0;
  }

  return {
    type,
    timeout,
    propCount
  };
}

function getTimeout(delays, durations) {
  while(delays.length < durations.length) {
    delays = delays.concat(delays);
  }

  return Math.max.apply(null, durations.map(function(d, i) {
    return toMs(d) + toMs(delays[i]);
  }));
}

// Old versions of Chromium (below 61.0.3163.100) formats floating pointer numbers
// in a locale-dependent way, using a comma instead of a dot.
// If comma is not replaced with a dot, the input will be rounded down (i.e. acting
// as a floor function) causing unexpected behaviors
function toMs(s) {
  return Number(s.slice(0, -1).replace(',', '.')) * 1000;
}

function isValidDuration(s) {
  return typeof s === 'number' && !isNaN(s) && isFinite(s) && s > 0;
}

export function enter(el, options, insertOrShow) {
  if(el._leaveCb) {
    el._leaveCb.cancelled = true;
    el._leaveCb();
  }

  const data = resolveTransition(options);

  if(!data) return;
  if(el._enterCb || el.nodeType !== 1) return;

  const {
    css,
    type,
    enterClass,
    enterToClass,
    enterActiveClass,
    beforeEnter,
    enter,
    afterEnter,
    enterCancelled,
    duration
  } = data;
  const beforeEnterHook = beforeEnter;
  const enterHook = enter;
  const afterEnterHook = afterEnter;
  const enterCancelledHook = enterCancelled;
  const expectsCss = css !== false && !isIE9;
  const userWantsControl = isFunction(enterHook) && enterHook.length > 1;
  const explicitEnterDuration = isObject(duration) ? duration.enter : duration;
  const cb = el._enterCb = once(function() {
    if(expectsCss) {
      removeClass(el, enterToClass);
      removeClass(el, enterActiveClass);
    }
    if(cb.cancelled) {
      if(expectsCss) {
        removeClass(el, enterClass);
      }
      enterCancelledHook && enterCancelledHook(el);
    } else {
      afterEnterHook && afterEnterHook(el);
    }
    el._enterCb = null;
  });

  beforeEnterHook && beforeEnterHook(el);

  if(expectsCss) {
    addClass(el, enterClass);
    addClass(el, enterActiveClass);

    nextFrame(function() {
      removeClass(el, enterClass);
      if(!cb.cancelled) {
        addClass(el, enterToClass);
        if(!userWantsControl) {
          if(isValidDuration(explicitEnterDuration)) {
            setTimeout(cb, explicitEnterDuration);
          } else {
            whenTransitionEnds(el, type, cb);
          }
        }
      }
    });
  }

  insertOrShow && insertOrShow(el);
  enterHook && enterHook(el, cb);

  if(!expectsCss && !userWantsControl) {
    cb();
  }
}

export function leave(el, options, removeOrHide) {
  if(el._enterCb) {
    el._enterCb.cancelled = true;
    el._enterCb();
  }

  const data = resolveTransition(options);

  if(!data || el.nodeType !== 1) removeOrHide && removeOrHide(el);

  const {
    css,
    type,
    leaveClass,
    leaveToClass,
    leaveActiveClass,
    beforeLeave,
    leave,
    afterLeave,
    leaveCancelled,
    delayLeave,
    duration
  } = data;
  const expectsCss = css !== false && !isIE9;
  const explicitEnterDuration = isObject(duration) ? duration.leave : duration;
  const beforeLeaveHook = beforeLeave;
  const leaveHook = leave;
  const afterLeaveHook = afterLeave;
  const leaveCancelledHook = leaveCancelled;
  const userWantsControl = isFunction(leaveHook) && leaveHook.length > 1;
  const cb = el._leaveCb = once(function() {
    if(expectsCss) {
      removeClass(el, leaveToClass);
      removeClass(el, leaveActiveClass);
    }
    if(cb.cancelled) {
      if(expectsCss) {
        removeClass(el, leaveClass);
      }
      leaveCancelledHook && leaveCancelledHook(el);
    } else {
      removeOrHide && removeOrHide(el);
      afterLeaveHook && afterLeaveHook(el);
    }
    el._leaveCb = null;
  });

  if(delayLeave) {
    delayLeave(doLeave);
  } else {
    doLeave();
  }

  function doLeave() {
    if(cb.cancelled) return;

    beforeLeaveHook && beforeLeaveHook(el);

    if(expectsCss) {
      addClass(el, leaveClass);
      addClass(el, leaveActiveClass);

      nextFrame(function() {
        removeClass(el, leaveClass);
        if(!cb.cancelled) {
          addClass(el, leaveToClass);
          if(!userWantsControl) {
            if(isValidDuration(explicitEnterDuration)) {
              setTimeout(cb, explicitEnterDuration);
            } else {
              whenTransitionEnds(el, type, cb);
            }
          }
        }
      });
    }

    leaveHook && leaveHook(el);

    if(!expectsCss && !userWantsControl) {
      cb();
    }
  }
}