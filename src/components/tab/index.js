import { query, hasClass, closest, getTargetFromElement, queryAll, triggerEvent, getChildElement, removeClass, addClass } from '../../utils/dom';
import { whenTransitionEnds } from '../../utils/transition';

class Tab {
  constructor(el) {
    this.$el = query(el);
  }

  show() {
    if(this.$el.parentNode && this.$el.parentNode.nodeType === 1 && hasClass(this.$el, 'active') || hasClass(this.$el, 'disabled')) {
      return;
    }
    
    const listElement = closest(this.$el, '.wx-tabs');
    const previous = this._getActiveElement(listElement);

    if(previous) {
      triggerEvent(previous, 'hide', {
        relatedTarget: this.$el
      });
    }

    triggerEvent(this.$el, 'show', {
      relatedTarget: previous
    });

    this._activate(this.$el, listElement);

    const target = getTargetFromElement(this.$el);
    const complete = () => {
      if(previous) {
        triggerEvent(previous, 'hidden', {
          relatedTarget: this.$el
        });
      }

      triggerEvent(this.$el, 'shown', {
        relatedTarget: previous
      });
    };

    if(target) {
      this._activate(target, target.parentNode, complete);
    } else {
      complete();
    }
  }

  _activate(element, container, callback) {
    const active = this._getActiveElement(container);
    const isTransitioning = callback && active && hasClass(active, 'fade');
    const complete = () => {
      if(active) {
        removeClass(active, 'active');
      }
      addClass(element, 'active');
      element.offsetWidth;
      if(hasClass(element, 'fade')) {
        addClass(element, 'show');
      }
      callback && callback();
    };
    if(isTransitioning) {
      whenTransitionEnds(active, null, complete);
      removeClass(active, 'show');
    } else {
      complete();
    }
  }

  _getActiveElement(container) {
    const activeElements = container && (container.nodeName === 'UL' || container.nodeName === 'OL')
      ? queryAll('.active', container).filter(el => {
          return el.parentNode.nodeName === 'LI' && el.parentNode.parentNode === container;
        })
      : getChildElement(container, '.active');
    return activeElements ? activeElements[0] : null;
  }
}

export function tab(el) {
  const instance = new Tab(el);
  instance.show();
  return instance;
}