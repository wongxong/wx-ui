import { createElement } from './dom';

let scrollBarWidth;

export function getScrollbarWidth() {
  if(scrollBarWidth !== undefined) return scrollBarWidth;

  const outer = createElement('div', {
    style: {
      'position': 'absolute',
      'top': '-9999px',
      'left': '-9999px',
      'width': '100px',
      'height': '100px',
      'visibility': 'hidden',
      'overflow': 'scroll'
    }
  });

  const inner = createElement('div', {
    style: {
      'width': '100%',
      'height': '200%'
    }
  });

  outer.appendChild(inner);
  document.body.appendChild(outer);

  const outerWidth = outer.offsetWidth;
  const innerWidth = inner.offsetWidth;
  
  scrollBarWidth = outerWidth - innerWidth;

  document.body.removeChild(outer);

  return scrollBarWidth;
}