import countNumber from './countNumber';

export function scrollTo(options = {}) {
  return countNumber({
    start: options.start,
    end: options.end,
    duration: options.duration || 200,
    iterator: x => {
      options.el.scrollTop = x;
    }
  });
}