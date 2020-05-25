import { query, on, off } from "../../utils/dom";
import extend from "../../utils/extend";
import { isFunction } from "util";
import debounce from "../../utils/debounce";


export class WxFilterInput {
  constructor(input, options) {
    this.input = query(input);
    this._options = extend({
      wait: 600,
      onChange: null
    }, options);
    this.setupListeners();
  }

  setupListeners() {
    this._filterImmediate = e => {
      const keyword = e.target.value;
      if(keyword === this._keyword) return;
      this._keyword = keyword;
      isFunction(this._options.onChange) && this._options.onChange(keyword);
    };
    this._filterDebounced = debounce(this._filterImmediate, this._options.wait);
    this.on(this.input, 'input', this._filterDebounced);
    this.on(this.input, 'keydown', e => {
      if(e.keyCode === 13) {
        e.stopPropagation();
        e.preventDefault();
        this._filterDebounced.cancel();
        this._filterImmediate(e);
      }
    });
  }

  on(el, type, fn) {
    (this._handlers || (this._handlers = [])).push({ el, type, fn });
    on(el, type, fn);
  }

  destroy() {
    if(this._handlers) {
      this._handlers.forEach(({ el, type, fn }) => {
        off(el, type, fn);
      });
      this._handlers = null;
    }
  }
}

export function wxFilterInput(el, options) {
  return new WxFilterInput(el, options);
}