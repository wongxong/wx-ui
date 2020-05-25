import { getScrollContainer, query, on, off } from '../../../utils/dom';
import throttle from '../../../utils/throttle';
import extend from '../../../utils/extend';

export class InfiniteScroll {
	constructor(el, options) {
		this.el = query(el);
		this.scrollEl = getScrollContainer(this.el);
		this.isScrollBody = this.scrollEl === window;
		this._options = extend({
      wait: 200,
      immediate: true,
      offset: 50,
      callback: null
    }, options);
		this._handlers = [];
		this._disabled = false;
		this._prevScrollY = 0;
		this._isScrolling = false;
		this.init();

		if(this._options.immediate) {
			this.handleScroll();
		}
	}

	init() {
		this._handlers.push({
			el: this.scrollEl,
			type: 'scroll',
			fn: throttle(() => {
				this.handleScroll();
			}, this._options.wait)
		});

		this._handlers.forEach(({ el, type, fn }) => {
			on(el, type, fn);
		});
	}

	isDisabled() {
		return this._disabled;
	}

	disable() {
		this._disabled = true;
	}

	enable() {
		this._disabled = false;
	}

	handleScroll() {
		if(this.isDisabled()) return;

		const scrollTop = this.getScrollTop();
		const isScrollToBottom = scrollTop > this._prevScrollY;

		this._prevScrollY = scrollTop;

		if(isScrollToBottom) {
			const toBottom = this.getScrollHeight() - this.getClientHeight() - scrollTop;

			if(toBottom < this._options.offset && !this._isScrolling) {
				if(this._options.callback) {
					this._isScrolling = true;
					this._options.callback.call(this, () => {
						this._isScrolling = false;
					});
				}
			}
		}
	}

	getScrollTop() {
		if(this.isScrollBody) {
			return document.documentElement.scrollTop || document.body.scrollTop;
		}
		return this.el.scrollTop;
	}

	getClientHeight() {
		if(this.isScrollBody) {
			return document.documentElement.clientHeight || document.body.clientHeight;
		}
		return this.el.clientHeight;
	}

	getScrollHeight() {
		if(this.isScrollBody) {
			return document.documentElement.scrollHeight || document.body.scrollHeight;
		}
		return this.el.scrollHeight;
	}

	destroy() {
		this._handlers.forEach(function(item) {
			off(item.el, item.type, item.fn);
		});
	}
}