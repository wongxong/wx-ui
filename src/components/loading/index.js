import { isFunction } from '../../utils/util';
import { createElement, query, addClass, removeClass, getComputedCSS, removeNode, setStyle } from '../../utils/dom';
import extend from '../../utils/extend';
import { enter, leave } from '../../utils/transition';

let loadingInstance;

export class Loading {
  constructor(options) {
    this._options = extend({
      fullscreen: true,
      lock: false,
      target: '',
      text: '',
      icon: '',
      customClass: '',
      background: ''
    }, options);
    try {
      this._options.target = this._options.target ? query(this._options.target) : null;
    } catch(err) {
      this._options.fullscreen = true;
    }
    if(this._options.target) {
      this._options.fullscreen = false;
    }
    if(this._options.fullscreen && loadingInstance) {
      return loadingInstance;
    }
    this._isDestroyed = false;
    this.setupTemplates();
    this.open();
    if(this._options.fullscreen) {
      loadingInstance = this;
    }
  }

  setupTemplates() {
    const $icon = createElement('div', {
      'class': 'wx-loading-icon',
      'domProps': {
        'innerHTML': renderIcon(this._options.icon)
      }
    });
    const $text = createElement('p', {
      'class': 'wx-loading-text',
      'domProps': {
        'innerHTML': renderText(this._options.text)
      }
    });
    const $spinner = createElement('div', {
      'class': 'wx-loading-spinner'
    }, [ $icon, $text ]);
    this.$el = createElement('div', {
      'class': {
        'wx-loading-mask': true,
        'is-fullscreen': this._options.fullscreen
      }
    }, [ $spinner ]);

    if(this._options.customClass) {
      addClass(this.$el, this._options.customClass);
    }

    if(this._options.background) {
      setStyle(this.$el, {
        'backgroundColor': this._options.background
      });
    }
  }

  open() {
    if(this._isDestroyed) return;
    enter(this.$el, { name: 'wx-loading-fade' }, () => {
      if(this._options.fullscreen) {
        if(this._options.lock) {
          addClass(document.body, 'wx-loading-parent--hidden');
        }
        document.body.appendChild(this.$el);
      } else {
        if(getComputedCSS(this._options.target, 'position') === 'static') {
          addClass(this._options.target, 'wx-loading-parent--relative');
        }
        this._options.target.appendChild(this.$el);
      }
    });
  }

  close(forceClose) {
    if(this._isDestroyed) return;
    const cb = () => {
      if(this._options.fullscreen) {
        removeNode(this.$el);
        removeClass(document.body, 'wx-loading-parent--hidden');
        loadingInstance = null;
      } else {
        removeNode(this.$el);
        removeClass(this._options.target, 'wx-loading-parent--relative');
      }
    };
    if(forceClose) {
      cb();
    } else {
      leave(this.$el, { name: 'wx-loading-fade' }, cb);
    }
  }

  destroy() {
    if(this._isDestroyed) return;
    this.close(true);
    this._isDestroyed = true;
  }
}

function renderIcon(icon) {
  if(icon) {
    return isFunction(icon) ? icon() : icon;
  }
  return '<svg class="circular" viewBox="25 25 50 50"><circle class="path" cx="50" cy="50" r="20" fill="none"/></svg>';
}

function renderText(text) {
  if(text) {
    return isFunction(text) ? text() : text;
  }
  return '';
}

export function loading(options) {
  return new Loading(options);
}