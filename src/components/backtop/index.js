import countNumber from '../../utils/countNumber';
import { query, on, off, getScrollContainer, show, hide, removeNode, one, queryAll } from '../../utils/dom';
import throttle from '../../utils/throttle';
import extend from '../../utils/extend';
import { enter, leave } from '../../utils/transition';

class BackTop {
  constructor(el, options) {
    this._options = extend({
      wait: 100,
      target: window,
      renderIcon: null,
      offset: 200,
      duration: 300
    }, options);
    this.$el = query(el);
    this.scrollEl = this._options.target 
      ? getScrollContainer(query(this._options.target))
      : window;
    this.isScrollBody = this.scrollEl === window;
    this.setupListeners();
  }

  setupListeners() {
    this.on(this.$el, 'click', () => {
      this.handleClick();
    });
    this.on(this.scrollEl, 'scroll', throttle(() => {
      this.handleScroll();
    }, this._options.wait));
  }

  handleScroll() {
    const scrollTop = this.getScrollTop();
    this.visibleChange(scrollTop > this._options.offset);
  }

  visibleChange(bool) {
    if(this.visible === bool) return;
    this.visible = bool;
    if(bool) {
      enter(this.$el, { name: 'wx-fade-drop' }, () => {
        show(this.$el);
      });
    } else {
      leave(this.$el, { name: 'wx-fade-drop' }, () => {
        hide(this.$el);
      });
    }
  }

  getScrollTop() {
		if(this.isScrollBody) {
			return document.documentElement.scrollTop || document.body.scrollTop;
		}
		return this.scrollEl.scrollTop;
  }
  
  setScrollTop(n) {
    if(this.isScrollBody) {
      document.documentElement.scrollTop = document.body.scrollTop = n;
		}
		this.scrollEl.scrollTop = n;
  }

  handleClick() {
    this._scroller = countNumber({
      start: this.getScrollTop(),
      end: 0,
      duration: this._options.duration,
      iterator: x => {
        this.setScrollTop(x);
      }
    });
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

  destroy() {
    if(this._isDestroyed) return;
    if(this._scroller) {
      this._scroller.destroy();
      this._scroller = null;
    }
    this.off();
    removeNode(this.$el);
    this._isDestroyed = true;
  }
}

export function backtop(el, options) {
  const instance = new BackTop(el, options);
  return instance;
}

one(document, 'DOMContentLoaded', () => {
  queryAll('[wx-toggle="backtop"]').forEach(el => {
    const target = el.getAttribute('data-target') || el.getAttribute('wx-target');
    backtop(el, { target: target || window });
  });
});