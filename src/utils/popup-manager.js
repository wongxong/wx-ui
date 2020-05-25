import { on, createElement, removeNode, hide, addClass, removeClass } from "./dom";
import { isFunction } from "./util";
import { whenTransitionEnds, nextFrame } from "./transition";

let zIndex = 2000;
let hasModal = false;

function getModal() {
  if(PopupManager.modalDom) {
    hasModal = true;
  } else {
    hasModal = false;
    PopupManager.modalDom = createElement('div', {
      'class': 'wx-modal-backdrop'
    });
  }
  return PopupManager.modalDom;
}

export const PopupManager = {
  modalDom: null,
  nextZIndex: () => {
    return PopupManager.zIndex++;
  },
  records: []
};

Object.defineProperty(PopupManager, 'zIndex', {
  get() {
    return zIndex;
  },
  set(newVal) {
    zIndex = newVal;
  }
});

function getTopPopup() {
  const length = PopupManager.records.length;
  const topPopup = length > 0 ? PopupManager.records[length - 1] : null;
  return topPopup ? topPopup.ctx : null;
}

export function beforeOpenPopup(ctx, dom) {
  const zIndex = PopupManager.nextZIndex();
  const zIndex2 = PopupManager.nextZIndex();
  const id = ctx._uid;
  if(!id) return;
  if(PopupManager.records.some(item => item.id === id)) return;
  const modalDom = getModal();
  modalDom.style.zIndex = zIndex;
  dom.style.zIndex = zIndex2;
  if(!hasModal) {
    addClass(modalDom, 'wx-backdrop-fade-enter');
    nextFrame(() => {
      whenTransitionEnds(modalDom, null, () => {
        removeClass(modalDom, 'wx-backdrop-fade-enter');
      });
    });
    document.body.appendChild(modalDom);
  }
  PopupManager.records.push({
    ctx,
    id,
    zIndex
  });
}

export function beforeClosePopup(ctx) {
  const id = ctx._uid;
  const modalDom = getModal();
  const records = PopupManager.records;

  if(records.length > 0) {
    const topItem = records[records.length - 1];
    if(topItem.id === id) {
      records.pop();

      if(records.length > 0) {
        modalDom.style.zIndex = records[records.length - 1].zIndex;
      }
    } else {
      for(let i = records.length - 1; i >= 0; i--) {
        if(records[i].id === id) {
          records.splice(i, 1);
          break;
        }
      }
    }
  }

  if(records.length === 0) {
    addClass(modalDom, 'wx-backdrop-fade-leave');
    nextFrame(() => {
      whenTransitionEnds(modalDom, null, () => {
        if(records.length === 0) {
          hide(modalDom);
          removeNode(modalDom);
          PopupManager.modalDom = null;
        }
        removeClass(modalDom, 'wx-backdrop-fade-leave');
      });
    });
  }
}

on(window, 'keydown', e => {
  if(e.keyCode === 27) {
    const topPopup = getTopPopup();
    if(topPopup && topPopup._options.keyboard && isFunction(topPopup.close)) {
      topPopup.close();
    }
  }
});