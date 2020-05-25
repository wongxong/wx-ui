import './scss/index.scss';

export * from './components/infinite-scroll';
export * from './components/modal';
export * from './components/dropdown';
export * from './components/loading';
export * from './components/confirm';
export * from './components/select';
export * from './components/collapse';
export * from './components/tab';
export * from './components/backtop';
export * from './components/tooltip';
export * from './utils/base-modal';
export * from './utils/lazy-load';

import * as Utils from './utils/util';
import throttle from './utils/throttle';
import debounce from './utils/debounce';
import extend from './utils/extend';
import * as DomUtil from './utils/dom';
import { onClickoutside, offClickoutside } from './utils/clickoutside';
import countNumber from './utils/countNumber';
import scrollIntoView from './utils/scrollIntoView';
import { scrollTo } from './utils/scrollTo';
import { getScrollbarWidth } from './utils/scrollbar-width';
import * as PopupManagerUtil from './utils/popup-manager';
import * as TransitionUtil from './utils/transition';
import * as CollapseTransitionUtil from  './components/collapse/collapse-transition';
import { dropdown } from './components/dropdown';
import { modal } from './components/modal';
import { tab } from './components/tab';

export const Util = {
  ...Utils,
  ...DomUtil,
  ...PopupManagerUtil,
  ...TransitionUtil,
  ...CollapseTransitionUtil,
  throttle,
  debounce,
  extend,
  onClickoutside,
  offClickoutside,
  countNumber,
  scrollTo,
  scrollIntoView,
  getScrollbarWidth
};

const { on, matchTarget, query } = DomUtil;

on(document, 'click', e => {
  const target = matchTarget(e.target, '[wx-toggle]');

  if(target) {
    const toggle = target.getAttribute('wx-toggle');

    switch(toggle) {
      case 'tab':
        return tab(target);

      case 'dropdown':
        return dropdown(target, query('.wx-dropdown__popper', target.parentNode));
      
      case 'modal':
        return modal(query(target.getAttribute('wx-target')));
    }
  }
});