import extend from './extend';
import { PopupManager } from './popup-manager';
import { on, off, hide, show, createComment, insertAfter, createElement, removeNode } from './dom';
const Popper = require('popper.js/dist/umd/popper');

export class WxPopper {
  createPopper(options) {
    if(this._popperJS) return;
    options = extend({
      transformOrigin: true,
      placement: 'bottom-start',
      offset: '0, 10',
      appendToBody: true,
      flip: true
    }, options);
    const parent = options.popperElm.parentNode;
    if(!parent) {
      this._withoutParentNode = true;
      document.body.appendChild(options.popperElm);
    } else if(options.appendToBody !== false && parent !== document.body) {
      this.$comment = this.$comment || createComment('');
      insertAfter(this.$comment, options.popperElm);
      document.body.appendChild(options.popperElm);
    }
    if(this._options.visibleArrow) {
      this.appendArrow();
    }
    show(options.popperElm);
    this._popperJS = new Popper(options.referenceElm, options.popperElm, {
      onCreate: () => {
        this.resetTransformOrigin(options);
        hide(options.popperElm);
        options.popperElm.offsetWidth;
        options.onCreate && options.onCreate.call(this);
        options.popperElm.style.zIndex = PopupManager.nextZIndex();
      },
      onUpdate: () => {
        this.resetTransformOrigin(options);
        options.onUpdate && options.onUpdate.call(this);
      },
      placement: options.placement,
      modifiers: {
        offset: {
          offset: options.offset
        },
        computeStyle: {
          gpuAcceleration: false
        },
        flip: {
          enabled: options.flip !== false
        }
      }
    });
  }

  updatePopper() {
    this._popperJS && this._popperJS.update();
  }

  destroyPopper() {
    if(this._popperJS) {
      this._popperJS.destroy();
      this._popperJS = null;
    }
  }

  resetTransformOrigin({ popperElm, transformOrigin }) {
    if(!popperElm || !transformOrigin) return;
    let placementMap = {
      top: 'bottom',
      bottom: 'top',
      left: 'right',
      right: 'left'
    };
    let placement = popperElm.getAttribute('x-placement').split('-')[0];
    let origin = placementMap[placement];
    popperElm.style.transformOrigin = ['top', 'bottom'].indexOf(placement) > -1 
      ? `center ${ origin }` 
      : `${ origin } center`;
  }

  appendArrow() {
    if(this._appended) return;
    this._appended = true;
    this.popperElm.appendChild(createElement('div', {
      'class': 'wx-popper__arrow',
      'attr': {
        'x-arrow': ''
      }
    }));
  }

  addMask() {
    if(this._options.backdrop) {
      if(!this.$mask) {
        this.$mask = createElement('div', {
          'class': 'wx-modal-backdrop',
          'style': {
            'backgroundColor': 'transparent'
          }
        });
      }
      this.$mask.style.zIndex = PopupManager.nextZIndex();
      document.body.appendChild(this.$mask);
      this._handleMaskClick = () => {
        this.close();
      };
      on(this.$mask, 'click', this._handleMaskClick);
    }
  }

  removeMask() {
    if(this._options.backdrop) {
      off(this.$mask, 'click', this._handleMaskClick);
      if(this.$mask) {
        removeNode(this.$mask);
        this.$mask = null;
      }
    }
  }

  toggle() {
    this.visible ? this.close() : this.open();
  }

  on(el, type, fn) {
    (this._handlers || (this._handlers = [])).push({ el, type, fn });
    on(el, type, fn);
  }

  off() {
    if(this._handlers) {
      this._handlers.forEach(({ el, type, fn }) => {
        off(el, type, fn);
      });
      this._handlers = null;
    }
  }
}