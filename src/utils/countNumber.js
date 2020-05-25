export default function countNumber(options = {}) {
	var startTime;
	var timestamp;
	var duration = options.duration || 1000;
	var timingFunc = options.timingFunc || function(x) {
    return x;
    // return Math.pow(x, 3);
    // if((x /= 0.5) < 1) {
		// 	return 0.5 * Math.pow(x, 3);
		// }
    // return 0.5 * (Math.pow((x-2), 3) + 2);
	};
	var timer = requestAnimationFrame(run);

	return {
		destroy: function() {
			if(timer) {
				cancelAnimationFrame(timer);
			}
			reset();
		}
	};

	function reset() {
		timer = null;
		startTime = null;
		timestamp = null;
		duration = null;
		timingFunc = null;
	}

	function run(t) {
		if(!startTime) {
			startTime = t;
		}
		timestamp = t;

		var ratio = (timestamp - startTime) / duration;
		var step = timingFunc(ratio) * (options.end - options.start);
		var current = options.start + step;

		if(options.start > options.end) {
			current = current < options.end ? options.end : current;
		} else {
			current = current > options.end ? options.end : current;
		}

		options.iterator && options.iterator(current, ratio);

		if(ratio < 1) {
			timer = requestAnimationFrame(run);
		} else {
			reset();
			options.callback && options.callback();
		}
	}
}