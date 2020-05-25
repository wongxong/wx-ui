import { isNumeric, isObject, isArray, isString } from './util';
import extend from './extend';

export function addClass(el, clsName) {
	if(!el || !clsName) return;
	clsName = clsName.trim();
	if(el.classList) {
		el.classList.add(...clsName.split(/\s+/));
	} else {
		var cur = ' ' + (el.getAttribute('class') || '') + ' ';
		clsName.split(/\s+/).forEach(function(d) {
			if(cur.indexOf(' ' + d + ' ') === -1) {
				cur += d + ' ';
			}
		});
		el.setAttribute('class', cur.trim());
	}
}

export function removeClass(el, clsName) {
	if(!el || !clsName) return;
	clsName = clsName.trim();
	if(el.classList) {
		el.classList.remove(...clsName.split(/\s+/));
		if(!el.classList.length) {
			el.removeAttribute('class');
		}
	} else {
		var cur = ' ' + (el.getAttribute('class') || '') + ' ';
		clsName.split(/\s+/).forEach(function(d) {
			if(cur.indexOf(' ' + d + ' ') !== -1) {
				cur = cur.replace(' ' + d + ' ', ' ');
			}
		});
		cur = cur.trim();
		if(cur) {
			el.setAttribute('class', cur);
		} else {
			el.removeAttribute('class');
		}
	}
}

export function hasClass(el, clsName) {
	if(!el || !clsName) return false;
	clsName = clsName.trim();
	if(el.classList) {
		return el.classList.contains(clsName);
	}
	var cur = ' ' + (el.getAttribute('class') || '') + ' ';
	return cur.indexOf(' ' + clsName + ' ') !== -1;
}

export function show(el, display) {
	el.style.display = display || 'block';
}

export function hide(el) {
	el.style.display = 'none';
}

export function on(el, event, fn) {
  el.addEventListener(event, fn, false);
}

export function off(el, event, fn) {
  el.removeEventListener(event, fn, false);
}

export function one(el, event, fn) {
  var listener = function() {
    off(el, event, fn);
    off(el, event, listener);
  };
  on(el, event, fn);
  on(el, event, listener);
}

export function triggerEvent(el, type, data, options) {
	options = extend({
		bubbles: true,
		cancelable: true
	}, options);
	let eventName;
	if(type.match(/mouse|click/)) {
		eventName = 'MouseEvents';
	} else if(type.match(/input|key/)) {
		eventName = 'KeyboardEvent';
	} else {
		eventName = 'HTMLEvents';
	}
	const evt = document.createEvent(eventName);
	evt.state = extend({}, data);
	evt.initEvent(type, options.bubbles, options.cancelable);
	el.dispatchEvent ? el.dispatchEvent(evt) : el.fireEvent('on' + type, evt);
	return evt;
}

export function setStyle(element, styles) {
	if(!styles) return;
	Object.keys(styles).forEach(function(k) {
		var unit = '';
		if(['width', 'height', 'left', 'right', 'top', 'bottom'].indexOf(k) !== -1 && isNumeric(styles[k])) {
			unit = 'px';
		}
		element.style[k] = styles[k] + unit;
	});
}

export function getComputedCSS(element, property) {
	var css = window.getComputedStyle(element, null);
	if(property) {
		return css[property];
	}
	return css;
}

export function getChildElement($el, selector) {
  let nodes = $el.childNodes;
  let length = nodes.length;
  let res = [];

  for(let i = 0; i < length; i++) {
    if(nodes[i].nodeType === 1) {
			if(selector != null) {
				if(nodes[i].matches(selector)) {
					res.push(nodes[i]);
				}
			} else {
				res.push(nodes[i]);
			}
    }
  }

  return res;
}

export function query(selector, root) {
	if(selector instanceof Node || selector === window) {
		return selector;
	}
	return (root || document).querySelector(selector);
}

export function queryAll(selector, root) {
	if(selector instanceof Node) {
		return [ selector ];
	} else if(selector instanceof NodeList) {
		return [].slice.call(selector);
	}
	return [].slice.call((root || document).querySelectorAll(selector));
}

export function closest(el, selector) {
	el = query(el);

	if(!el) return;

	let parent = el.parentNode;

	while(parent && parent.matches) {
		if(parent.matches(selector)) {
			return parent;
		}
		parent = parent.parentNode;
	}
}

export function isScroll(el, vertical) {
	if(vertical !== false) {}

	var css = getComputedCSS(el);
	var overflow = vertical !== false ? css['overflow-y'] : css['overflow-x'];

	return overflow.match(/overflow|auto/);
}

export function getScrollContainer(el, vertical) {
	var parent = el;

	while(parent) {
		if([ window, document, document.documentElement ].indexOf(parent) > -1) {
			return window;
		} 

		if(isScroll(parent, vertical)) {
			return parent;
		}

		parent = parent.parentNode;
	}
}

export function createComment(text) {
	return document.createComment(text);
}

export function createElement(tag, props, children) {
	var el = document.createElement(tag);

	props && Object.keys(props).forEach(k => {
		switch(k) {
			case 'class':
				if(isArray(props[k])) {
					addClass(el, props[k].join(' '));
				} else if(isObject(props[k])) {
					addClass(el, Object.keys(props[k]).filter(item => props[k][item]).join(' '));
				} else if(isString(props[k])) {
					addClass(el, props[k]);
				}
				break;

			case 'style':
				setStyle(el, props[k]);
				break;

			case 'attr':
				Object.keys(props[k]).forEach(item => {
					el.setAttribute(item, props[k][item]);
				});
				break;

			case 'on':
				Object.keys(props[k]).forEach(type => {
					on(el, type, props[k][type]);
				});
				break;

			case 'domProps': 
				Object.keys(props[k]).forEach(item => {
					el[item] = props[k][item];
				});
				break;
		}
	});

	children && children.forEach(child => {
		if(isString(child)) {
			el.appendChild(document.createTextNode(child));
		} else if(child instanceof Node) {
			el.appendChild(child);
		} else if(isObject(child)) {
			el.appendChild(createElement(child.tag, child.props, child.children));
		}
	});

	return el;
}

export function insertBefore(newNode, referenceNode) {
	try {
		referenceNode.parentNode.insertBefore(newNode, referenceNode);
	} catch(e) {}
}

export function insertAfter(newNode, referenceNode) {
	try {
		referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
	} catch(e) {}
}

export function removeNode(node) {
	try {
		node.parentNode.removeChild(node);
	} catch(e) {}
}

export function matchTarget(target, selector, root = document) {
	let parent = target;

	while(parent && parent !== root) {
		if(parent.matches(selector)) {
			return parent;
		}
		parent = parent.parentNode;
	}
}

export function measureTextWidth(text, clsName, styles) {
	const el = createElement('div', null, [ text ]);
	addClass(el, clsName);
	setStyle(el, Object.assign({
		position: 'absolute',
  	left: '-999px',
  	top: '-999px'
	}, styles || {}));
	document.body.appendChild(el);
	const width = el.offsetWidth;
	document.body.removeChild(el);
	return width;
}

export function offset(el, container) {
	var top = el.offsetTop;
	var left = el.offsetLeft;
	var parent = el.offsetParent;

	if(container) {
		while(parent && parent !== container && container.contains(parent)) {
			top += parent.offsetTop;
			left += parent.offsetLeft;
			parent = parent.offsetParent;
		}
	} else {
		while(parent) {
			top += parent.offsetTop;
			left += parent.offsetLeft;
			parent = parent.offsetParent;
		}
	}

	return {
		left: left,
		top: top
	};
}

export function getOffsetParent(element) {
	var offsetParent = element.offsetParent;
	return (
		offsetParent === window.document.body || !offsetParent 
			? window.document.documentElement 
			: offsetParent
	)
}

export function getTargetFromElement(element) {
	let selector = element.getAttribute('data-target') || element.getAttribute('wx-target');

	if(!selector || selector === '#') {
		let hrefAttr = element.getAttribute('href');
		selector = hrefAttr && hrefAttr !== '#' ? hrefAttr.trim() : '';
	}

	try {
		return query(selector);
	} catch(err) {
		return null;
	}
}