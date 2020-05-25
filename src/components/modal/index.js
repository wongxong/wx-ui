import { BaseModal } from '../../utils/base-modal';
import { query, show, hide, matchTarget, triggerEvent, createComment, insertAfter, removeNode } from '../../utils/dom';
import { leave, enter } from '../../utils/transition';
import extend from '../../utils/extend';
import { isFunction } from '../../utils/util';

export class Modal extends BaseModal {
  constructor(el, options) {
    super();
    this.$el = query(el);
    if(!this.$el) {
      throw new Error('[ Modal ]: el must be a HTMLElement.');
    }
    this._options = extend({
      appendToBody: true,
      backdrop: true,
      keyboard: true,
      lock: true,
      destroyAfterClose: true,
      beforeClose: null,
      beforeOpen: null
    }, options);
    this.setupListeners();
  }

  setupListeners() {
    this.on(this.$el, 'click', e => {
      if(this._options.backdrop === true && e.target === this.$el) {
        return this.close();
      }
      const target = matchTarget(e.target, '[wx-dismiss="modal"]', this.$el);
      if(target) {
        e.preventDefault();
        e.stopPropagation();
        this.close();
      }
    });
  }

  open() {
    if(this._isDestroyed) return;
    if(this.visible) return;
    this.visible = true;
    const cb = () => {
      triggerEvent(this.$el, 'open');
      this.beforeOpenModal();
      enter(this.$el, {
        name: 'wx-fade-drop',
        afterEnter: () => {
          triggerEvent(this.$el, 'opened');
        }
      }, () => {
        if(this._options.appendToBody !== false && this.$el.parentNode !== document.body) {
          this.$comment = this.$comment || createComment('');
          insertAfter(this.$comment, this.$el);
          document.body.appendChild(this.$el);
        }
        show(this.$el);
      });
    };
    if(isFunction(this._options.beforeOpen)) {
      this._options.beforeOpen(cb);
    } else {
      cb();
    }
  }

  close(forceClose) {
    if(this._isDestroyed) return;
    if(!this.visible) return;
    this.visible = false;
    const cb = () => {
      this.beforeCloseModal();
      const later = () => {
        hide(this.$el);
      };
      if(forceClose) {
        triggerEvent(this.$el, 'close');
        later();
        this.restoreBodyStyle();
        triggerEvent(this.$el, 'closed');
        this._options.destroyOnClose && this.destroy();
      } else {
        triggerEvent(this.$el, 'close');
        leave(this.$el, {
          name: 'wx-fade-drop',
          afterLeave: () => {
            this.restoreBodyStyle();
            triggerEvent(this.$el, 'closed');
            this._options.destroyOnClose && this.destroy();
          }
        }, later);
      }
    };
    if(isFunction(this._options.beforeClose)) {
      this._options.beforeClose(cb);
    } else {
      cb();
    }
  }

  destroy() {
    if(this._isDestroyed) return;
    this.close(true);
    this.off();
    if(this.$comment && this.$comment.parentNode) {
      insertAfter(this.$el, this.$comment);
      removeNode(this.$comment);
    } else if(this._withoutParentNode) {
      removeNode(this.popperElm);
    }
    this._isDestroyed = true;
  }
}

export function modal(el, options) {
  var instance = new Modal(el, options);
  instance.toggle();
  return instance;
}