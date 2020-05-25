import { addClass, removeClass } from '../../utils/dom';
import { enter, leave } from '../../utils/transition';

const CollapseTransition = {
  beforeEnter: (el) => {
    addClass(el, 'wx-collapse-transition');
    if(!el.dataset) el.dataset = {};

    el.dataset.oldPaddingTop = el.style.paddingTop;
    el.dataset.oldPaddingBottom = el.style.paddingBottom;

    el.style.height = 0;
    el.style.paddingTop = 0;
    el.style.paddingBottom = 0;
  },
  enter: (el) => {
    el.dataset.oldOverflow = el.style.overflow;

    if(el.scrollHeight !== 0) {
      el.style.height = el.scrollHeight + 'px';
    } else {
      el.style.height = '';
    }

    el.style.paddingTop = el.style.oldPaddingTop;
    el.style.paddingBottom = el.style.oldPaddingBottom;
    el.style.overflow = 'hidden';
  },
  afterEnter(el) {
    // for safari: remove class then reset height is necessary
    removeClass(el, 'wx-collapse-transition');
    el.style.height = '';
    el.style.overflow = el.dataset.oldOverflow;
  },
  beforeLeave: (el) => {
    if (!el.dataset) el.dataset = {};
    el.dataset.oldPaddingTop = el.style.paddingTop;
    el.dataset.oldPaddingBottom = el.style.paddingBottom;
    el.dataset.oldOverflow = el.style.overflow;

    el.style.height = el.scrollHeight + 'px';
    el.style.overflow = 'hidden';
  },
  leave: (el) => {
    if(el.scrollHeight !== 0) {
      // for safari: add class after set height, or it will jump to zero height suddenly, weired
      addClass(el, 'wx-collapse-transition');
      el.style.height = 0;
      el.style.paddingTop = 0;
      el.style.paddingBottom = 0;
    }
  },
  afterLeave: (el) => {
    removeClass(el, 'wx-collapse-transition');
    el.style.height = '';
    el.style.overflow = el.dataset.oldOverflow;
    el.style.paddingTop = el.dataset.oldPaddingTop;
    el.style.paddingBottom = el.dataset.oldPaddingBottom;
  }
};

export function collapseEnter(el, insertOrShow) {
  enter(el, {
    beforeEnter: CollapseTransition.beforeEnter,
    enter: CollapseTransition.enter,
    afterEnter: CollapseTransition.afterEnter
  }, insertOrShow);
}

export function collapseLeave(el, removeOrHide) {
  leave(el, {
    beforeLeave: CollapseTransition.beforeLeave,
    leave: CollapseTransition.leave,
    afterLbeforeLeave: CollapseTransition.afterLbeforeLeave
  }, removeOrHide);
}