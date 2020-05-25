import { guid } from "./util";
import { on, off, removeClass, hasClass, getComputedCSS, addClass } from "./dom";
import { beforeOpenPopup, beforeClosePopup } from "./popup-manager";
import { getScrollbarWidth } from "./scrollbar-width";

export class BaseModal {
  constructor() {
    this._uid = guid();
    this.visible = false;
    this._isDestroyed = false;
  }

  toggle() {
    this.visible ? this.close() : this.open();
  }

  close() {}

  open() {}

  beforeOpenModal() {
    beforeOpenPopup(this, this.$el);
    this.setBodyStyle();
  }

  beforeCloseModal() {
    beforeClosePopup(this);
  }

  setBodyStyle() {
    if(this._options.lock !== false) {
      this.withoutHiddenClass = !hasClass(document.body, 'wx-popup-parent--hidden');
      const body = document.body;
      const bodyStyles = getComputedCSS(body);
      if(this.withoutHiddenClass) {
        this.bodyPaddingRight = body.style.paddingRight;
        this.computedBodyPaddingRight = parseFloat(bodyStyles['paddingRight'], 10);
      }
      const scrollbarWidth = getScrollbarWidth();
      const bodyHasOverflow = body.offsetWidth + body.offsetLeft < window.innerWidth;
      if(scrollbarWidth > 0 && bodyHasOverflow && this.withoutHiddenClass) {
        body.style.paddingRight = this.computedBodyPaddingRight + scrollbarWidth + 'px';
      }
      addClass(body, 'wx-popup-parent--hidden');
    }
  }

  restoreBodyStyle() {
    if(this.withoutHiddenClass) {
      document.body.style.paddingRight = this.bodyPaddingRight;
      removeClass(document.body, 'wx-popup-parent--hidden');
    }
    this.withoutHiddenClass = true;
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