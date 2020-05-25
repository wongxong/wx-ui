import { WxPopper } from '../../utils/wx-popper';
import { query, createElement, triggerEvent, show, removeNode } from '../../utils/dom';
import extend from '../../utils/extend';
import { isFunction } from '../../utils/util';
import { enter, leave } from '../../utils/transition';
import debounce from '../../utils/debounce';

class Tooltip extends WxPopper {
  constructor(referenceElm, options) {
    super();
    this.referenceElm = query(referenceElm);
    this._options = extend({
      onClick: null,
      theme: 'dark',
      content: '',
      placement: 'top',
      manual: false,
      enterable: true, // 鼠标是否可以进入提示框内
      popperClass: '',
      transition: 'wx-fade-zoom',
      visibleArrow: true
    }, options);
    this.setupTemplates();
    this.debounceClose = debounce(() => {
      this._doClose();
    }, 200);
    this.setupListeners();
    this.referenceElm._wx_tooltip = this;
  }

  setupTemplates() {
    let clsNames = [ 'wx-tooltip__popper' ];
    if(this._options.popperClass) {
      clsNames.push(this._options.popperClass);
    }
    if(this._options.theme) {
      clsNames.push('is-' + this._options.theme);
    }

    this.popperElm = createElement('div', {
      'class': clsNames,
      'domProps': {
        'innerHTML': '<div class="wx-tooltip__content">'+ this._options.content +'</div>'
      }
    });
  }

  setupListeners() {
    if(isFunction(this._options.onClick)) {
      this.on(this.popperElm, 'click', e => {
        this._options.onClick.call(this, e, this);
      });
    }

    if(!this._options.manual) {
      this.on(this.referenceElm, 'mouseenter', () => {
        this.open();
      });
      this.on(this.referenceElm, 'mouseleave', () => {
        this.close();
      });
    }

    this.on(this.popperElm, 'mouseenter', () => {
      this.setExpectedState(true);
    });

    this.on(this.popperElm, 'mouseleave', () => {
      this.setExpectedState(false);
      this.debounceClose();
    });
  }

  open() {
    this.setExpectedState(true);
    if(!this.expectedState || this._options.manual) return;
    this._doOpen();
  }
  
  close() {
    this.setExpectedState(false);
    this.debounceClose();
  }

  setExpectedState(expectedState) {
    if(expectedState === false) {
      clearTimeout(this.timeoutPending);
    }
    this.expectedState = expectedState;
  }

  _doOpen() {
    if(this._isDestroyed) return;
    if(this.visible) return;
    this.visible = true;
    triggerEvent(this.referenceElm, 'open');
    const cb = () => {
      this.addMask();
      enter(this.popperElm, { 
        name: this._options.transition,
        afterEnter: () => {
          triggerEvent(this.referenceElm, 'opened');
        }
      }, () => {
        show(this.popperElm);
        this.updatePopper();
      });
    };
    if(this._popperJS) {
      cb();
    } else {
      this.createPopper({
        placement: this._options.placement,
        referenceElm: this.referenceElm,
        popperElm: this.popperElm,
        onCreate: cb
      });
    }
  }

  _doClose(forceClose) {
    if (this._options.enterable && this.expectedState || this._options.manual) return;
    if(this._isDestroyed) return;
    if(!this.visible) return;
    this.visible = false;
    const cb = () => {
      removeNode(this.popperElm);
      this.destroyPopper();
    };
    if(forceClose) {
      triggerEvent(this.referenceElm, 'close');
      cb();
      triggerEvent(this.referenceElm, 'closed');
    } else {
      triggerEvent(this.referenceElm, 'close');
      leave(this.popperElm, { 
        name: this._options.transition,
        afterLeave: () => {
          triggerEvent(this.referenceElm, 'closed');
        }
      }, cb);
    }
  }

  destroy() {
    if(this._isDestroyed) return;
    this._doClose(true);
    this.destroyPopper();
    this.off();
    delete this.referenceElm._wx_tooltip;
    this._isDestroyed = true;
  }
}

export function tooltip(el, options) {
  return new Tooltip(el, options);
}