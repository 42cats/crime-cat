
const SECOND = 1000;
/**
 * 타이머 디바운서 
 * @param {int} time 1당 1초
 */
class Debounce {
	constructor(time) {
		this.timer = new Date();
		this.setTime = time * SECOND;
	}
	timeToGo() {
		const ret = (new Date() - this.timer) >= this.setTime ? true : false;
		console.log("debonce = ", ret);
		this.timer = new Date();
		return ret;
	}
}

module.exports = Debounce;