var TolerableError = function (message) {
    this.name = "TolerableError";
    this.message = message || "A tolerable error";
};

TolerableError.prototype.constructor = TolerableError;

module.exports = TolerableError;
