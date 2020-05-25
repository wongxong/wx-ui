import { show, hide, query, matchTarget, removeNode, insertAfter, triggerEvent, addClass, getChildElement, removeClass } from "../../utils/dom";
import extend from "../../utils/extend";
import { enter, leave } from "../../utils/transition";
import { onClickoutside, offClickoutside } from '../../utils/clickoutside';
import { isFunction } from "../../utils/util";
import { WxPopper } from '../../utils/wx-popper';

export class Dropdown extends WxPopper {
  constructor(referenceElm, popperElm, options) {
    super();
    this.referenceElm = query(referenceElm);
    if(!this.referenceElm) {
      throw new Error('[ Dropdown ]: referenceElm must be a HTMLElement.');
    }
    this.$el = this.referenceElm.parentNode;
    this.popperElm = query(popperElm, this.$el);
    if(!this.popperElm) {
      throw new Error('[ Dropdown ]: popperElm must be a HTMLElement.');
    }
    this._options = extend({
      placement: 'bottom-start',
      backdrop: false,
      closeOnClick: true,
      destroyOnClose: true,
      onChange: null
    }, options);
    this.setupListeners();
  }

  setupListeners() {
    this.on(this.referenceElm, 'click', e => {
      e.preventDefault();
      e.stopPropagation();
      this.toggle();
    });

    if(!this._options.backdrop) {
      onClickoutside(this.referenceElm, this.popperElm, () => {
        this.close();
      });
    }

    if(isFunction(this._options.onChange) || this._options.closeOnClick) {
      this.on(this.popperElm, 'click', e => {
        const target = matchTarget(e.target, '.wx-dropdown__list-item', this.popperElm);
        if(target) {
          getChildElement(target.parentNode, '.active').forEach(node => {
            removeClass(node, 'active');
          });
          addClass(target, 'active');
          isFunction(this._options.onChange) && this._options.onChange(target.getAttribute('command'));
          this._options.closeOnClick && this.close();
        }
      });
    }
  }

  open() {
    if(this._isDestroyed) return;
    if(this.visible) return;
    this.visible = true;
    triggerEvent(this.referenceElm, 'open');
    const cb = () => {
      this.addMask();
      enter(this.popperElm, { 
        name: 'wx-fade-zoom',
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

  close(forceClose) {
    if(this._isDestroyed) return;
    if(!this.visible) return;
    this.visible = false;
    const cb = () => {
      hide(this.popperElm);
      if(this.$comment && this.$comment.parentNode) {
        insertAfter(this.popperElm, this.$comment);
        removeNode(this.$comment);
      } else {
        this.$el.appendChild(this.popperElm);
      }
      this.destroyPopper();
    };
    if(forceClose) {
      triggerEvent(this.referenceElm, 'close');
      cb();
      this.removeMask();
      triggerEvent(this.referenceElm, 'closed');
      this._options.destroyOnClose && this.destroy();
    } else {
      triggerEvent(this.referenceElm, 'close');
      leave(this.popperElm, { 
        name: 'wx-fade-zoom',
        afterLeave: () => {
          this.removeMask();
          triggerEvent(this.referenceElm, 'closed');
          this._options.destroyOnClose && this.destroy();
        }
      }, cb);
    }
  }

  destroy() {
    if(this._isDestroyed) return;
    this.close(true);
    this.destroyPopper();
    this.off();
    offClickoutside(this.referenceElm);
    if(this._withoutParentNode) {
      removeNode(this.popperElm);
    }
    this._isDestroyed = true;
  }
}

export function dropdown(referenceElm, popperElm, options) {
  var instance = new Dropdown(referenceElm, popperElm, options);
  instance.toggle();
  return instance;
}