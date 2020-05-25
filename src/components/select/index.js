import { WxPopper } from "../../utils/wx-popper";
import { show, hide, query, addClass, removeClass, createElement, removeNode, matchTarget, insertBefore, insertAfter, closest, setStyle, measureTextWidth, triggerEvent } from "../../utils/dom";
import extend from "../../utils/extend";
import { isFunction, isUndef, isArray } from "../../utils/util";
import debounce from "../../utils/debounce";
import { offClickoutside, onClickoutside } from "../../utils/clickoutside";
import { enter, leave } from "../../utils/transition";
import scrollIntoView from "../../utils/scrollIntoView";
import { selectParser } from "./select-parser";

export class Select extends WxPopper {
  constructor(selector, options) {
    super();
    this.$field = query(selector);
    if(!this.$field) {
      throw new Error('[ Select ]: field must be a HTMLSelectElement.');
    }
    this._options = this._getOptions(options);
    if(this._options.multiple) {
      this._options.clearable = false;
    }
    this.init();
  }

  _getDataBySelectParser($field) {
    if($field instanceof Node && $field.tagName.toUpperCase() === 'SELECT') {
      return selectParser($field);
    }
    return [];
  }

  _getOptions(options) {
    const name = this.$field.getAttribute('name');
    const multiple = this.$field.getAttribute('multiple');
    const disabled = this.$field.getAttribute('disabled');
    const clearable = this.$field.getAttribute('clearable');
    const filterable = this.$field.getAttribute('filterable');
    const customOptions = {};

    if(!isUndef(name)) {
      customOptions.name = name;
    }

    if(!isUndef(multiple)) {
      customOptions.multiple = true;
    }

    if(!isUndef(disabled)) {
      customOptions.disabled = true;
    }
    
    if(!isUndef(clearable)) {
      customOptions.clearable = true;
    }
    if(!isUndef(filterable)) {
      customOptions.filterable = true;
    }

    const data = this._getDataBySelectParser(this.$field);
    if(data.length) {
      customOptions.data = data;
      this._dataFromSelect = true;
    }

    return extend({
      name: '',
      placeholder: '请输入',
      multiple: false,
      filterable: true,
      clearable: false,
      static: false,
      data: [],
      wait: 600,
      valueField: 'value',
      labelField: 'text',
      noMatchText: '无匹配数据',
      filterMethod: null,
      formatResult: null,
      onCreate: null,
      onChange: null,
      popperClass: '',
      referenceClass: '',
      arrowClass: ''
    }, options, customOptions);
  }

  init() {
    this.setupTemplates();
    this.setupListeners();

    proxy(this, this._options, 'data', this.render);
    proxy(this, this._options, '_selectedItems', this._updateSelectedItems);
    proxy(this, this._options, '_isFocus', this._updateFocus);
    proxy(this, this._options, 'visible', this._updateVisible);
    proxy(this, this._options, '_keyword', this.handleSearch);
    this.data = this._options.data.slice(0);

    if(isFunction(this._options.onCreate)) {
      const data = this._options.multiple
        ? this._selectedItems.map(item => item.state)
        : this._selectedItems[0] ? this._selectedItems[0].state : null;
      this._options.onCreate.call(this, data);
    }
  }

  setupTemplates() {
    this.arrow = createElement('i', {
      'class': 'wx-select__arrow',
      'domProps': {
        'innerHTML': '<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M896 335.928889a31.573333 31.573333 0 0 0-9.386667-22.471111 31.857778 31.857778 0 0 0-45.226666 0L512 642.844444 182.613333 312.888889a31.857778 31.857778 0 0 0-45.226666 45.226667L489.244444 711.111111a32.142222 32.142222 0 0 0 45.511112 0l351.857777-352.426667a32.142222 32.142222 0 0 0 9.386667-22.755555z"></path></svg>'
      }
    });
    addClass(this.arrow, this._options.arrowClass);
    this.clearBtn = createElement('i', {
      'class': 'wx-select__clear wx-close'
    });
    hide(this.clearBtn);
    const suffix = createElement('span', {
      'class': 'wx-select__suffix'
    }, [ this.arrow, this.clearBtn ]);
    this.input = createElement('input', {
      'class': 'wx-select__input'
    });
    setReadonly(this.input, !this._options.filterable);
    this.referenceElm = createElement('div', {
      'class': 'wx-select__reference'
    }, [ this.input, suffix ]);
    addClass(this.referenceElm, this._options.referenceClass);
    this.$el = createElement('div', {
      'class': {
        'wx-select': true,
        'is-static': this._options.static,
        'is-multiple': this._options.multiple
      }
    }, [ this.referenceElm ]);
    this.list = createElement('ul', {
      'class': 'wx-select__list'
    });
    this.popperElm = createElement('div', {
      'class': 'wx-popper wx-select__popper'
    }, [ this.list ]);
    addClass(this.popperElm, this._options.popperClass);
    insertAfter(this.$el, this.$field);
    addClass(this.$field, 'wx-select--inited');
    if(this._options.static) {
      this.$el.appendChild(this.popperElm);
    }
  }

  setupListeners() {
    if(this._options.filterable) {
      this._filterImmediate = e => {
        const keyword = e.target.value;
        if(this._keyword === keyword) return;
        this._keyword = keyword;
      };
      this._filterDebounced = debounce(this._filterImmediate, this._options.wait);
      this.on(this.input, 'input', e => {
        this._adjustWidth();
        this._filterDebounced(e);
      });
      this.on(this.input, 'keydown', e => {
        if(e.keyCode === 13) {
          e.preventDefault();
          e.stopPropagation();
          this._filterDebounced.cancel();
          this._filterImmediate(e);
        }
      });
    }

    this.on(this.input, 'focus', e => {
      this._timer && clearTimeout(this._timer);
      this._updateInputStatus(this.visible);
    });

    this.on(this.input, 'blur', () => {
      this._timer = setTimeout(() => {
        this._isFocus = false;
        this._updateInputStatus();
        if(this._options.static) {
          this._keyword = '';
        }
      }, 150);
    });

    if(this._options.clearable) {
      this.on(this.clearBtn, 'click', e => {
        e.stopPropagation();
        e.preventDefault();
        const last = this._getLastSelectedItem();
        last.state.selected = false;
        this.handleChange(last);
        show(this.arrow);
        hide(this.clearBtn);
      });

      this.on(this.referenceElm, 'mouseenter', e => {
        if(this._selectedItems.length) {
          show(this.clearBtn);
          hide(this.arrow);
        }
      });

      this.on(this.referenceElm, 'mouseleave', e => {
        show(this.arrow);
        hide(this.clearBtn);
      });
    }

    this.on(this.referenceElm, 'click', e => {
      const target = matchTarget(e.target, '.wx-select__tag-remove', this.referenceElm);
      if(target) {
        e.preventDefault();
        e.stopPropagation();
        this.handleOptionClick(closest(target, '.wx-select__tag'));
      } else if(!this._options.static) {
        if(this.visible && this._isFocus) {
          this.close();
        } else {
          this.open();
        }
      }
      this._isFocus = true;
      this.input.focus();
    });

    this.on(this.list, 'click', e => {
      const target = matchTarget(e.target, '.wx-select__list-item', this.list);
      target && this.handleOptionClick(target);
      this._isFocus = true;
      this.input.focus();
    });

    if(!this._options.static) {
      onClickoutside(this.referenceElm, this.popperElm, () => {
        this.close();
      });
    }
  }

  _adjustWidth() {
    const { multiple, filterable } = this._options;
    if(multiple) {
      let width;

      if(filterable) {
        let word = this.input.value;
        if(this._selectedItems.length) {
          width = measureTextWidth(word, 'wx-select__measure-text') + 10;
          width = Math.max.apply(null, [ 20, width ]);
          if(width + 50 >= this.referenceElm.clientWidth) {
            width = '100%';
          }
        } else {
          width = '100%';
        }
      } else {
        width = this._selectedItems.length ? 10 : '100%';
      }

      setStyle(this.input, { width });

      this.updatePopper();
    }
  }

  _updateFocus(target, source, key, newVal) {
    if(source[key] === newVal) return;
    source[key] = newVal;
    newVal ? addClass(target.referenceElm, 'is-focus') : removeClass(target.referenceElm, 'is-focus');
  }

  _updateVisible(target, source, key, newVal) {
    if(source[key] === newVal) return;
    source[key] = newVal;
    newVal ? addClass(target.referenceElm, 'is-visible') : removeClass(target.referenceElm, 'is-visible');
    target._updateInputStatus();
  }

  _updateInputStatus(byFocus) {
    const last = this._getLastSelectedItem();
    const { filterable, multiple, labelField, placeholder } = this._options;

    if(last && filterable) {
      if(multiple) {
        this.input.value = this.visible || byFocus ? this.input.value : '';
      } else {
        this.input.value = this.visible || byFocus ? '' : last.state[labelField];
        this.input.placeholder = this.visible || byFocus ? last.state[labelField] : placeholder;
      }
    }
  }

  _getLastSelectedItem() {
    const length = this._selectedItems.length;
    return length > 0 ? this._selectedItems[length - 1] : null;
  }

  _initSelectedItems() {
    if(this._selectedItems) return;
    const temp = this.data.filter(item => item.state.selected);
    if(this._options.multiple) {
      this._selectedItems = temp;
    } else if(temp.length > 1) {
      this.handleChange(temp.shift());
    } else {
      this._selectedItems = temp;
    }
  }

  _updateSelectedItems(target, source, key, newVal) {
    if(!newVal) return;
    source[key] = newVal;
    const { placeholder, labelField, valueField, multiple, name } = target._options;
    const last = target._getLastSelectedItem();
    if(multiple) {
      target.input.placeholder = last ? '' : placeholder;
    } else {
      target.input.value = last ? last.state[labelField] : '';
      target.input.placeholder = placeholder;

      if(!target._dataFromSelect) {
        if(!target.$inputHidden) {
          target.$inputHidden = createElement('input', {
            'domProps': {
              'type': 'hidden',
              'name': name
            }
          });
          insertBefore(target.$inputHidden, target.input);
        }
        target.$inputHidden.value = last ? last.state[valueField] : '';
      }
    }
  }

  _initDataItem(item) {
    let res;

    if(item.$el) {
      res = item;
    } else {
      const formatResult = isFunction(this._options.formatResult) 
        ? this._options.formatResult 
        : defaultFormatResult;
      res = {
        $el: createElement('li', {
          'class': 'wx-select__list-item',
          'domProps': {
            'innerHTML': formatResult.call(this, item, this)
          }
        }),
        _mounted: true,
        state: item
      };
      this.list.appendChild(res.$el);
    }
    return res;
  }

  _updateDataItem(item) {
    const { $el, state } = item;
    const { multiple, labelField, valueField, name } = this._options;
    state.disabled ? addClass($el, 'disabled') : removeClass($el, 'disabled');
    item.matched !== false ? removeClass($el, 'hidden') : addClass($el, 'hidden');
    state.selected ? addClass($el, 'active') : removeClass($el, 'active');

    if(multiple) {
      if(state.selected) {
        if(!item.$tag) {
          item.$tag = createElement('span', {
            'class': 'wx-select__tag',
            'domProps': {
              'innerHTML': state[labelField] + '<i class="wx-close wx-select__tag-remove"></i>'
            }
          });
          if(this._dataFromSelect) {
            item.$option = query('[value="'+ state[valueField] +'"]', this.$field);
          } else {
            item.$tag.appendChild(createElement('input', {
              'domProps': {
                'type': 'hidden',
                'name': name,
                'value': state[valueField]
              }
            }));
          }
        }
        if(!item._mounted_tag) {
          item._mounted_tag = true;
          insertBefore(item.$tag, this.input);
        }
        if(this._dataFromSelect) {
          item.$option.selected = true;
        }
      } else {
        item._mounted_tag = false;
        item.$tag && removeNode(item.$tag);
        if(this._dataFromSelect) {
          item.$option = item.$option || query('[value="'+ state[valueField] +'"]', this.$field);
          item.$option.selected = false;
        }
      }
    } else {
      if(this._dataFromSelect) {
        if(!item.$option) {
          item.$option = query('[value="'+ state[valueField] +'"]', this.$field);
        }
        item.$option.selected = state.selected;
      }
    }

    return item;
  }

  render(target, source, key, newVal) {
    let noMatch = true;

    newVal = newVal || [];

    if(newVal.length) {
      source[key] = newVal.map(item => {
        item = target._initDataItem(item);
  
        item = target._updateDataItem(item);
  
        if(item.matched !== false) {
          noMatch = false;
        }
  
        return item;
      });
    } else {
      (source[key] || []).forEach(item => {
        if(item._mounted) {
          item._mounted = false;
          removeNode(item.$el);
        }
        if(item._mounted_tag) {
          item._mounted_tag = false;
          removeNode(item.$tag);
        }
      });
      source[key] = newVal;
    }

    target._initSelectedItems();

    if(noMatch) {
      target.$noMatch = target.$noMatch || createElement('li', {
        'class': 'wx-select__no-match',
        'domProps': {
          'innerHTML': target._options.noMatchText
        }
      });
      target.list.appendChild(target.$noMatch);
    } else {
      target.$noMatch && removeNode(target.$noMatch);
    }

    target._adjustWidth();
    target.updatePopper();
  }

  update(data) {
    if(!isArray(data)) {
      data = this._getDataBySelectParser(data);
    }
    this.close(true);
    this.data = [];
    this.data = data.slice(0);
  }

  handleSearch(target, source, key, newVal) {
    if(source[key] === newVal) return;
    source[key] = newVal;
    const filterMethod = isFunction(target._options.filterMethod)
      ? target._options.filterMethod
      : defaultFilterMethod;
    target.data = target.data.map(item => {
      item.matched = filterMethod.call(target, item.state, target._keyword, target);
      return item;
    });
    target.popperElm.scrollTop = 0;
  }

  handleOptionClick(target) {
    const currentItem = this.data.find(item => {
      return item.$el === target || item.$tag === target;
    });
    if(!this._options.multiple) {
      if(!this._options.static) {
        this.close();
      }
      if(currentItem.state.selected || currentItem.state.disabled) return;
    }
    currentItem.state.selected = !currentItem.state.selected;
    this.handleChange(currentItem);
  }

  handleChange(currentItem, triggerChangeEvent) {
    const valueField = this._options.valueField;
    if(currentItem.state.selected) {
      if(this._options.multiple) {
        this._selectedItems = this._selectedItems.concat(currentItem);
      } else {
        this._selectedItems = [ currentItem ];
      }
    } else {
      if(this._options.multiple) {
        this._selectedItems = this._selectedItems.filter(item => item.state[valueField] !== currentItem.state[valueField]);
      } else {
        this._selectedItems = [];
      }
    }
    this.data = this.data.map(item => {
      if(!this._options.multiple) {
        item.state.selected = currentItem.state[valueField] === item.state[valueField]
          ? currentItem.state.selected
          : false;
      }
      return item;
    });
    if(triggerChangeEvent !== false) {
      const data = this._options.multiple
        ? this._selectedItems.map(item => item.state)
        : this._selectedItems[0] ? this._selectedItems[0].state : null;
        
      if(isFunction(this._options.onChange)) {
        this._options.onChange.call(this, data);
      }
      
      triggerEvent(this.$field, 'change', { data });
    }
  }

  open() {
    if(this._isDestroyed) return;
    if(this.visible) return;
    this.visible = true;
    const updatePopperSize = () => {
      setStyle(this.popperElm, {
        'width': this.referenceElm.offsetWidth
      });
    };
    const cb = () => {
      updatePopperSize();
      setReadonly(this.input, !this._options.filterable);
      this.addMask();
      enter(this.popperElm, { 
        name: 'wx-fade-zoom'
      }, () => {
        show(this.popperElm);
        this.updatePopper();
        const last = this._getLastSelectedItem();
        last && scrollIntoView(this.popperElm, last.$el);
      });
    };
    if(this._popperJS) {
      cb();
    } else {
      this.createPopper({
        placement: this._options.placement,
        referenceElm: this.referenceElm,
        popperElm: this.popperElm,
        onCreate: cb,
        onUpdate: updatePopperSize
      });
    }
  }

  close(forceClose) {
    if(this._isDestroyed) return;
    if(!this.visible) return;
    this.visible = false;
    setReadonly(this.input, true);
    const cb = () => {
      hide(this.popperElm);
      if(this.$comment && this.$comment.parentNode) {
        insertAfter(this.popperElm, this.$comment);
        removeNode(this.$comment);
      } else {
        this.$el.appendChild(this.popperElm);
      }
      this.destroyPopper();
    };
    if(forceClose) {
      cb();
      this._keyword = '';
      this.removeMask();
      this._options.destroyOnClose && this.destroy();
    } else {
      leave(this.popperElm, { 
        name: 'wx-fade-zoom',
        afterLeave: () => {
          this._keyword = '';
          this.removeMask();
          this._options.destroyOnClose && this.destroy();
        }
      }, cb);
    }
  }

  destroy() {
    if(this._isDestroyed) return;
    this.close(true);
    this.destroyPopper();
    this.off();
    if(!this._options.static) {
      offClickoutside(this.referenceElm);
    }
    removeNode(this.$el);
    removeClass(this.$field, 'wx-select--inited');
    this._isDestroyed = true;
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

export function select(el, options) {
  return new Select(el, options);
}

function defaultFormatResult(data, ctx) {
  return data[ctx._options.labelField];
}

function defaultFilterMethod(data, keyword, ctx) {
  if(keyword) {
    // 使用正则表达式匹配前需要把 特殊字符 转义
    // ^ $ . * +  - ? = ! : | \ / ( ) [ ] { }
    let str = keyword.replace(/[\[\]\{\}\(\)\\\/\|\.\?\+\-\!\=\*\^\$]/g, function(a) {
      return '\\' + a;
    });
    let matchReg = new RegExp(str, 'i');

    return !!data[ctx._options.labelField].match(matchReg);
  }

  return true;
}

function setReadonly(input, readonly) {
  input && (input.readOnly = readonly);
}