import { isFunction, guid } from './util';

var nodeLists = [];
var ctx = '__$$clickoutside$$__';
var startClick = null;
var mousedownHandler = function(e) {
  startClick = e;
};
var mouseupHandler = function(e) {
  nodeLists.forEach(node => {
    node[ctx].documentHandler(startClick, e);
  });
};

function createDocumentHandler(element, popperElm, callback) {
  return function(mouseup, mousedown) {
    if(!mouseup) return;
    if(!mousedown) return;
    if(!mouseup.target) return;
    if(!mousedown.target) return;
    if(element.contains(mouseup.target)) return;
    if(element.contains(mousedown.target)) return;
    if(element === mouseup.target) return;
    if(popperElm && (popperElm.contains(mouseup.target) || popperElm.contains(mousedown.target))) return;
    if(isFunction(callback)) {
      callback();
    }
  }
}

export function onClickoutside(element, popperElm, callback) {
  element[ctx] = {
    uid: guid(),
    documentHandler: createDocumentHandler(element, popperElm, callback)
  };

  nodeLists.push(element);

  if(nodeLists.length === 1) {
    document.addEventListener('mousedown', mousedownHandler, false);
    document.addEventListener('mouseup', mouseupHandler, false);
  }
}

export function offClickoutside(element) {
  if(!element || !element[ctx]) return;
  nodeLists = nodeLists.filter(item => {
    return item[ctx].uid !== element[ctx].uid;
  });
  delete element[ctx];

  if(nodeLists.length === 0) {
    document.removeEventListener('mousedown', mousedownHandler, false);
    document.removeEventListener('mouseup', mouseupHandler, false);
  }
}