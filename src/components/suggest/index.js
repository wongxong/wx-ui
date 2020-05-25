import { query, closest, on, off, createElement, insertBefore, removeNode, setStyle, matchTarget, addClass, removeClass } from "../../utils/dom";
import debounce from "../../utils/debounce";
import extend from "../../utils/extend";
import { isFunction } from "../../utils/util";
import { InfiniteScroll } from '../infinite-scroll';
import { onClickoutside, offClickoutside } from "../../utils/clickoutside";
const Popper = require('popper.js');

export class Suggest {
  constructor(el, options) {
    this.$searchInput = query(el);
    this.referenceElm = closest(this.$searchInput, '.wx-suggest__reference');
    this.$wrap = closest(this.$searchInput, '.wx-suggest');
    this._options = extend({
      data: [],
      minimumInputLength: 1,
      labelField: 'text',
      valueField: 'value',
      placeholder: '请输入',
      loadingText: '加载中...',
      noDataText: '暂无数据',
      formatResult: null,
      remote: null
    }, options);
    this._handlers = [];
    this._page = {
      page: 1,
      per_page: 10
    };
    this.init();
  }

  init() {
    const formatResult = this._options.formatResult || defaultFormatResult;
    const emptyObj = {
      _keyword: '',
      _loading: false,
      _selectedItem: null
    };

    proxy(this, this._options, 'data', (target, source, key, newVal) => {
      source[key] = (newVal || []).map(item => {
        const temp = item.$el ? item : {
          $el: createElement('li', {
            'class': 'wx-suggest__list-item',
            'domProps': {
              'innerHTML': formatResult.call(target, item, target)
            }
          }),
          state: item
        };
        return temp;
      });
      target.render();
    });
    proxy(this, emptyObj, '_keyword', (target, source, key, newVal) => {
      source[key] = newVal;
      target.handleQuery(true);
      target.$clearBtn = target.$clearBtn || query('.wx-suggest__clear', this.referenceElm);
      if(target.$clearBtn) {
        if(target.$searchInput.value) {
          removeClass(target.$clearBtn, 'hidden');
        } else {
          addClass(target.$clearBtn, 'hidden');
        }
      }
    });
    proxy(this, emptyObj, '_loading', (target, source, key, newVal) => {
      source[key] = newVal;
      if(newVal) {
        this.$noData && removeNode(this.$noData);
        if(!target.$loading) {
          target.$loading = createElement('li', {
            'class': 'wx-suggest__loading',
            'domProps': {
              'innerHTML': target._options.loadingText
            }
          });
        }
        if(this._page.page === 1) {
          target.popperElm.scrollTop = 0;
          let firstChild;
          if(firstChild = target.$dropdownList.firstChild) {
            insertBefore(target.$loading, firstChild);
          } else {
            target.$dropdownList.appendChild(target.$loading);
          }
        } else {
          target.$dropdownList.appendChild(target.$loading);
        }
      } else {
        removeNode(target.$loading);
      }
    });
    proxy(this, emptyObj, '_selectedItem', (target, source, key, newVal) => {
      source[key] = newVal;
      target.handleChange();
    });
    this.setupTemplates();
    this.setupListeners();
    this.data = this._options.data;
    this._preset = this.data;
    this._selectedItem = this.data.find(item => item.state.selected);
    this.resetParams();
    isFunction(this._options.onCreate) && this._options.onCreate.call(this, this._selectedItem ? this._selectedItem.state : null);
    this._inited = true;
  }

  setupTemplates() {
    this.$searchInput.placeholder = this._options.placeholder;
    this.popperElm = createElement('div', {
      'class': 'wx-suggest__dropdown'
    });
    this.$dropdownList = createElement('ul', {
      'class': 'wx-suggest__list'
    });
    this.popperElm.appendChild(this.$dropdownList);
  }

  setupListeners() {
    this._filterImmediate = e => {
      const keyword = e.target.value.trim();
			if(this._keyword === keyword) {
        if(!keyword) {
          this.setSelectedItemNull();
        }
        return;
      }
      this.open();
      this._keyword = keyword;
		};
    this._filterDebounced = debounce(this._filterImmediate, 600);

    this._handlers.push({
      el: this.$searchInput,
      type: 'input',
      fn: e => {
        this._filterDebounced(e);
      }
    });

    this._handlers.push({
      el: this.$searchInput,
      type: 'keydown',
      fn: e => {
        if(e.keyCode === 13) {
          e.preventDefault();
          e.stopPropagation();
          this._filterDebounced.cancel();
          this._filterImmediate(e);
        }
      }
    });

    this._handlers.push({
      el: this.referenceElm,
      type: 'click',
      fn: e => {
        const target = matchTarget(e.target, '.wx-suggest__clear');
        if(target) {
          e.stopPropagation();
          this.setSelectedItemNull();
          this.$searchInput.value = '';
          this._keyword = '';
        } else {
          if(this._preset.length) {
            this.open();
          } else {
            if(this._selectedItem) {
              this.open();
              this.data = [ this._selectedItem ];
            }
          }
        }
        this.$searchInput.focus();
      }
    });

    this._handlers.push({
      el: this.$dropdownList,
      type: 'click',
      fn: e => {
        const target = matchTarget(e.target, '.wx-suggest__list-item');
        target && this.handleOptionClick(target);
      }
    });

    onClickoutside(this.referenceElm, this.popperElm, () => {
      this.close();
    });

    this._handlers.forEach(({ el, type, fn }) => {
      on(el, type, fn);
    });
  }

  handleOptionClick(target) {
    let current;
    this.data = this.data.map(item => {
      item.state.selected = item.$el === target;
      if(item.state.selected) {
        current = item;
      }
      return item;
    });
    this._selectedItem = current;
    this.close();
  }

  handleChange() {
    this.updateSelection();
    if(this._inited && isFunction(this._options.onChange)) {
      this._options.onChange.call(this, this._selectedItem ? this._selectedItem.state : null);
    }
  }

  updateSelection() {
    if(this._selectedItem) {
      if(!this._inited || this.visible || this.$searchInput.value) {
        this.$searchInput.value = this._selectedItem.state[this._options.labelField];
        this._keyword = '';
      } else {
        this.setSelectedItemNull();
      }
    } else {
      this.$searchInput.value = '';
    }
  }

  handleQuery(resetPage, cb) {
    if(!this.visible) return;
    if(this._keyword.length < this._options.minimumInputLength) {
      this.setDataToPreset();
      return;
    }
    if(isFunction(this._options.remote)) {
      if(this._loading) {
        this._queryCb = null;
      }
      if(resetPage) {
        this._page.page = 1;
      }
      this._loading = true;
      const valueField = this._options.valueField;
      const params = {
        q: this._keyword,
        page: Object.assign({}, this._page)
      };
      const next = this._queryCb = newVal => {
        if(!this.visible) {
          this._queryCb = null;
          this._loading = false;
          return;
        }
        if(this._queryCb !== next) return;
        this._queryCb = null;
        this._loading = false;
        newVal = newVal.reduce((res, item) => {
          if(resetPage || !this.data.some(d => d.state[valueField] === item[valueField])) {
            if(this._selectedItem && this._selectedItem.state[valueField] === item[valueField]) {
              this._selectedItem._mounted = false;
              res.push(this._selectedItem);
            } else {
              res.push(item);
            }
          }
          return res;
        }, []);
        resetPage && this.beforeChangeData();
        this.data = (resetPage ? [] : this.data).concat(newVal);
        this._page.page += 1;
        cb && cb();
      };
      this._options.remote.call(this, params, next);
    }
  }

  beforeChangeData() {
    this.data.forEach(item => {
      if(item._mounted) {
        item._mounted = false;
        removeNode(item.$el);
      }
    });
  }

  render() {
    if(this.data.length) {
      this.data.forEach(item => {
        if(!item._mounted) {
          item._mounted = true;
          this.$dropdownList.appendChild(item.$el);
        }
        if(item.state.selected) {
          addClass(item.$el, 'active');
        } else {
          removeClass(item.$el, 'active');
        }
      });
      this.$noData && removeNode(this.$noData);
    } else {
      this.$noData = this.$noData || createElement('li', {
        'class': 'wx-suggest__empty-data',
        'domProps': {
          'innerHTML': this._options.noDataText
        }
      });
      this.$dropdownList.appendChild(this.$noData);
    }

    this._popper && this._popper.update();
  }

  createPopper() {
    const updatePopperSize = () => {
      setStyle(this.popperElm, {
        'width': this.referenceElm.offsetWidth
      });
    };
    
    this._popper = new Popper(this.referenceElm, this.popperElm, {
      placement: 'bottom-start',
      onUpdate: () => {
        updatePopperSize();
      },
      onCreate: () => {
        updatePopperSize();
      },
      modifiers: {
        offset: {
          offset: '0, 10'
        },
        computeStyle: {
          gpuAcceleration: false
        }
      }
    });
  }

  destroyPopper() {
    if(this._popper) {
      this._popper.destroy();
      this._popper = null;
    }
  }

  createInfiniteScroll() {
    this._infiniteScroll = new InfiniteScroll(this.popperElm, {
      callback: done => {
        this.handleQuery(null, done);
      }
    });
  }

  destroyInfiniteScroll() {
    if(this._infiniteScroll) {
      this._infiniteScroll.destroy();
      this._infiniteScroll = null;
    }
  }

  open() {
    if(this.visible) return;
    this.visible = true;
    if(!this._mounted) {
      this._mounted = true;
      document.body.appendChild(this.popperElm);
      this.createPopper();
      this.createInfiniteScroll();
    }
  }

  setDataToPreset() {
    this._page.page = 1;
    const valueField = this._options.valueField;
    this.beforeChangeData();
    this.data = this._preset.map(item => {
      item._mounted = false;
      item.state.selected = this._selectedItem && this._selectedItem.state[valueField] === item.state[valueField];
      return item;
    });
  }

  setSelectedItemNull() {
    if(this._selectedItem) {
      this._selectedItem.state.selected = false;
      removeClass(this._selectedItem.$el, 'active');
    }
    this._selectedItem = null;
  }

  resetParams() {
    // 重复设置 _keyword 用于更新 $clearBtn 的显示隐藏
    this._keyword =  this._keyword;
    this.setDataToPreset();
    this.updateSelection();
  }

  close() {
    if(!this.visible) return;
    this.visible = false;
    this.resetParams();
    if(this._mounted) {
      this._mounted = false;
      this.destroyPopper();
      this.destroyInfiniteScroll();
      removeNode(this.popperElm);
    }
  }

  destroy() {
    this.close();
    this.destroyPopper();
    this.destroyInfiniteScroll();
    offClickoutside(this.referenceElm);
    this._handlers.forEach(({ type, el, fn }) => {
      off(el, type, fn);
    });
  }
}

function proxy(target, source, key, cb) {
  Object.defineProperty(target, key, {
    get() {
      return source[key];
    },
    set(newVal) {
      cb && cb(target, source, key, newVal);
    }
  });
}

function defaultFormatResult(data, ctx) {
  return data[ctx._options.labelField];
}