export default function debounce(fn, wait, immediate, triggerEnd) {
	var context;
	var args;
	var timer;
	var timestamp;
	var result;
	var later = function() {
		var last = new Date().getTime() - timestamp;

		if(last < wait && last >= 0) {
			timer = setTimeout(later, wait - last);
		} else {
			timer = null;

			if(!immediate || immediate && triggerEnd) {
				result = fn.apply(context, args);
				context = args = null;

				return result;
			}
		}
	};

	var debounced = function() {
		context = this;
		timestamp = new Date().getTime();
		args = arguments;

		var callNow = immediate && !timer;

		if(!timer) {
			timer = setTimeout(later, wait);
		}

		if(callNow) {
			result = fn.apply(context, args);
			
			if(!triggerEnd) {
				context = args = null;
			}

			return result;
		}
	};

	debounced.cancel = function() {
		clearTimeout(timer);

		timer = null;
		context = args = null;
	};

	return debounced;
};