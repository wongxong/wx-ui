export default function throttle(fn, wait, options) {
	options = options || {};
	var context;
	var args;
	var timer;
	var result;
	var previous = 0;
	var later = function() {
		previous = options.leading === false ? 0 : new Date().getTime();
		timer = null;
		fn.apply(context, args);
		context = args = null;
	};

	var throttled = function() {
		var now = new Date().getTime();

		if(!previous && options.leading === false) {
			previous = now;
		}

		var remaining = wait - (now - previous);
		context = this;
		args = arguments;

		if(remaining <= 0 || remaining > wait) {
			if(timer) {
				clearTimeout(timer);
				timer = null;
			}

			previous = now;
			result = fn.apply(context, args);
			context = args = null;
		} else if(!timer && options.trailing !== false) {
			timer = setTimeout(later, remaining);
		}

		return result;
	};

	throttled.cancel = function() {
		clearTimeout(timer);

		previous = 0;
		timer = null;
		context = args = null;
	};

	return throttled;
};