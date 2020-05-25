import { 
  query, getChildElement,
  addClass, removeClass,
  hasClass,
  on, off
} from '../../utils/dom';
import extend from '../../utils/extend';
import { collapseEnter, collapseLeave } from './collapse-transition';
import { isFunction } from '../../utils/util';

/*
  <div class="wx-collapse effect-accordion">
    <div class="wx-collapse-item active">
      <div class="wx-collapse-item__header"></div>
      <div class="wx-collapse-item__body"></div>
    </div>
    <div class="wx-collapse-item">
      <div class="wx-collapse-item__header"></div>
      <div class="wx-collapse-item__body"></div>
    </div>
    <div class="wx-collapse-item">
      <div class="wx-collapse-item__header"></div>
      <div class="wx-collapse-item__body"></div>
    </div>
  </div>
*/

function getCollapseItems($collapse) {
  return getChildElement($collapse, '.wx-collapse-item').map(node => {
    return {
      $collapseItem: node,
      $collapseItemHeader: getChildElement(node, '.wx-collapse-item__header')[0],
      $collapseItemBody: getChildElement(node, '.wx-collapse-item__body')[0],
      data: {
        isActive: hasClass(node, 'active')
      }
    };
  });
}

export class Collapse {
  constructor($el, options) {
    this.$collapse = query($el);
    this.options = extend({
      accordion: false,
      onChange: null
    }, options, {
      accordion: hasClass(this.$collapse, 'effect-accordion')
    });

    this._isDestroyed = false;

    this.$collapseItems = getCollapseItems(this.$collapse);

    this.setupEventListener();

    if(this.options.accordion) {
      this.handleOpen(this.$collapseItems.find(item => item.data.isActive));
    } else {
      this.$collapseItems.forEach(item => {
        item.data.isActive ? this.openOneItem(item) : this.handleClose(item);;
      });
    }
  }

  setupEventListener() {
    this.$collapseItems.forEach(dataItem => {
      let { $collapseItemHeader, $collapseItemBody, data } = dataItem;

      if($collapseItemHeader && $collapseItemBody) {
        this.on($collapseItemHeader, 'click', (e) => {
          data.isActive ? this.handleClose(dataItem) : this.handleOpen(dataItem);
          isFunction(this.options.onChange) && this.options.onChange.call(this, dataItem);
        });
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
    this.off();
    this._isDestroyed = true;
  }

  handleOpen(dataItem) {
    if(this._isDestroyed) return;
    if(!dataItem) return;

    if(this.options.accordion) {
      this.$collapseItems.filter(item => item.data.isActive)
        .forEach(item => {
          this.handleClose(item);
        });
      this.openOneItem(dataItem);
    } else {
      this.openOneItem(dataItem);
    }
  }

  openOneItem(dataItem) {
    if(this._isDestroyed) return;
    let { $collapseItem, $collapseItemBody, data } = dataItem;
    data.isActive = true;
    collapseEnter($collapseItemBody, () => {
      $collapseItemBody.style.display = 'block';
      addClass($collapseItem, 'active');
    });
  }

  handleClose(dataItem) {
    if(this._isDestroyed) return;
    if(!dataItem) return;
    let { $collapseItem, $collapseItemBody, data } = dataItem;
    data.isActive = false;
    collapseLeave($collapseItemBody, () => {
      $collapseItemBody.style.display = 'none';
      removeClass($collapseItem, 'active');
    });
  }
}

export function collapse(el, options) {
  return new Collapse(el, options);
}