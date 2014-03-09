var TolerableError = function (message, code) {
    this.name = "TolerableError";
    this.message = message || "A tolerable error";
	this.code = code || 400;
};

TolerableError.prototype.constructor = TolerableError;

module.exports = TolerableError;
