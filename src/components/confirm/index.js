import { BaseModal } from "../../utils/base-modal";
import extend from "../../utils/extend";
import { createElement, addClass, show, hide, removeNode, on, matchTarget, off } from "../../utils/dom";
import { isFunction } from "../../utils/util";
import { enter, leave } from "../../utils/transition";

export class Confirm extends BaseModal {
  constructor(options) {
    super();
    this._options = extend({
      appendToBody: true,
      backdrop: true,
      keyboard: true,
      lock: true,
      destroyOnClose: false,
      beforeClose: null,
      title: '提示',
      message: '',
      customClass: '',
      showCancelButton: true,
      showConfirmButton: true,
      cancelButtonText: '取消',
      confirmButtonText: '确定',
      callback: null
    }, options);
    this.setupTemplates();
    this.setupListeners();
  }

  setupTemplates() {
    const html = renderTemplate(this._options);
    this.$el = createElement('div', {
      'class': 'wx-modal-confirm'
    });
    this.$el.innerHTML = html;
    addClass(this.$el, this._options.customClass);
  }

  setupListeners() {
    on(this.$el, 'click', e => {
      if(this._options.backdrop === true && e.target === this.$el) {
        this._action = 'close';
        return this.close();
      }
      const target = matchTarget(e.target, '[wx-action]', this.$el);
      if(target) {
        e.stopPropagation();
        e.preventDefault();
        this._action = target.getAttribute('wx-action');
        this.close();
      }
    });
  }

  open() {
    if(this._isDestroyed) return;
    if(this.visible) return;
    this.visible = true;
    this.beforeOpenModal();
    enter(this.$el, { name: 'wx-fade-drop' }, () => {
      document.body.appendChild(this.$el);
      show(this.$el);
    });
  }

  close(forceClose) {
    if(this._isDestroyed) return;
    if(!this.visible) return;
    this.visible = false;
    const cb = () => {
      this.beforeCloseModal();
      const later = () => {
        hide(this.$el);
        removeNode(this.$el);
      };
      if(forceClose) {
        later();
      } else {
        leave(this.$el, { 
          name: 'wx-fade-drop',
          afterLeave: () => {
            this.restoreBodyStyle();
            this._options.destroyOnClose && this.destroy();
          }
        }, later);
      }
      setTimeout(() => {
        if(isFunction(this._options.callback)) {
          this._options.callback(this._action);
        }
      });
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
    this._action = '';
    this._isDestroyed = true;
  }
}

export function confirm(options) {
  const ins = new Confirm(options);
  ins.open();
  return ins;
}

function renderTemplate(options) {
  let html = '';
  html += '<div class="wx-modal-confirm-dialog">';
  html +=   '<div class="wx-modal-confirm__header">';
  html +=     '<h5 class="wx-modal-confirm__title">';
  html +=       isFunction(options.title) ? options.title() : options.title;
  html +=     '</h5>';
  html +=     '<button class="wx-modal-confirm__headerBtn wx-close" type="button" wx-action="close"></button>';
  html +=   '</div>';
  html +=   '<div class="wx-modal-confirm__body">';
  html +=     isFunction(options.message) ? options.message() : options.message;
  html +=   '</div>';
  html +=   '<div class="wx-modal-confirm__footer">';
  if(options.showCancelButton) {
    html +=   '<button type="button" class="wx-button wx-button-small" wx-action="cancel">';
    html +=     isFunction(options.cancelButtonText) ? options.cancelButtonText() : options.cancelButtonText;
    html +=   '</button>';
  }
  if(options.showConfirmButton) {
    html +=   '<button type="button" class="wx-button wx-button-small wx-button-primary" wx-action="confirm">';
    html +=     isFunction(options.confirmButtonText) ? options.confirmButtonText() : options.confirmButtonText;
    html +=   '</button>';
  }
  html +=   '</div>';
  html += '</div>';
  return html;
}