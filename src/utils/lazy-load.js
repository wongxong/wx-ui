import { getScrollContainer, query, addClass, setStyle, on, off, queryAll } from './dom';
import throttle from './throttle';
import extend from './extend';
import { isFunction } from './util';

export class LazyLoad {
  constructor(options) {
    this._options = extend({
      el: window,
      effect: 'cover',
      delay: 300,
      offset: 50,
      attr: 'lazy-src',
      defaultImage: '',
      showClass: '',
      callback: null,
      autoDestroy: true
    }, options);
    this._options.el = query(this._options.el);
    this.scrollEl = getScrollContainer(this._options.el);
    this.isScrollBody = this.scrollEl === window;
    this.setupListeners();

    setTimeout(() => {
      this.loadImage();
    }, 200);
  }

  setupListeners() {
    const scrollEvent = throttle(() => {
      this.handleScroll();
    }, 150);
    if(window.jQuery) {
      jQuery(this.scrollEl).on('scroll.lazyLoad', scrollEvent);
    } else {
      this.on(this.scrollEl, 'scroll', scrollEvent);
    }
  }

  handleScroll() {
    this._timer && clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      this.loadImage();
    }, this._options.delay);
  }
  
  loadImage() {
    const { attr, offset, defaultImage, showClass } = this._options;
    const nodes = queryAll('['+ attr +']', this.isScrollBody ? document : this.scrollEl);

    if(!nodes.length) {
      return this.handleCallback();
    }

    const lazyTag = 'wx-lazy-load-img';

    nodes.forEach(node => {
      if(
        !node.getAttribute(lazyTag) && isScrollIntoView(node, { 
          offset, 
          scrollEl: this.scrollEl 
        })
      ) {
        node.setAttribute(lazyTag, true);
        const src = node.getAttribute(attr);
        const isImg = node.tagName.toLowerCase() === 'img';
        const effect = node.getAttribute('effect') || this._options.effect;
        const handleAbort = () => {
          node.removeAttribute(lazyTag);
        };
        const handleError = () => {
          node.removeAttribute(attr);
          node.removeAttribute(lazyTag);
          const defaultImg = node.getAttribute('default-src') || defaultImage;
          if(defaultImg) {
            if(isImg) {
              node.src = defaultImg;
            } else {
              setStyle(node, {
                backgroundSize: effect,
                backgroundImage: 'url('+ defaultImg +')'
              });
            }
          }
          node.removeAttribute('default-src');
        };
        const handleSuccess = () => {
          node.removeAttribute(attr);
          node.removeAttribute(lazyTag);
          node.removeAttribute('default-src');
          addClass(showClass);

          if(isImg) {
            
          } else {
            setStyle(node, {
              backgroundSize: effect,
              backgroundImage: 'url("' + src + '")'
            });
          }
        };

        if(!src) {
          return handleError();
        }

        const img = new Image();

        img.onload = handleSuccess;
        img.onabort = handleAbort;
        img.onerror = handleError;

        img.src = src;
      }
    });
  }

  handleCallback() {
    if(isFunction(this._options.callback)) {
      this._options.callback.call(this, this);
    }
    this._options.autoDestroy && this.destroy();
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
    if(window.jQuery) {
      jQuery(this.scrollEl).off('scroll.lazyLoad');
    } else {
      this.off();
    }
    this._isDestroyed = true;
  }
}

function isScrollIntoView(node, { scrollEl, offset }) {
	var width;
	var height;

	if(scrollEl.getBoundingClientRect) {
		var rect = scrollEl.getBoundingClientRect();
		width = rect.width;
		height = rect.height;
	} else {
		width = window.innerWidth;
		height = window.innerHeight;
	}

	var view = {
		top: -1 * offset,
		bottom: height + offset,
		left: -1 * offset,
		right: width + offset
	};
	var rect = node.getBoundingClientRect();

	if(!rect.width || !rect.height) return false;

	var isSeen = ( rect.bottom >= view.top 
								&& rect.top <= view.bottom 
								&& rect.right >= view.left 
								&& rect.left <= view.right );

	return isSeen;
}

export function lazyLoad(options) {
  return new LazyLoad(options);
}