function EventEmitter() {
    if (!(this instanceof EventEmitter)) return new EventEmitter();
    this._events = this._events || {};
}

EventEmitter.prototype.on = function (type, listener) {
    this._events = this._events || {};
    this._events[type] = this._events[type] || [];
    this._events[type].push(listener);
    return this;
};

EventEmitter.prototype.emit = function (type, ...args) {
    if (!this._events || !this._events[type]) return false;
    this._events[type].forEach(listener => listener.apply(this, args));
    return true;
};

EventEmitter.prototype.removeListener = function (type, listener) {
    if (!this._events || !this._events[type]) return this;
    this._events[type] = this._events[type].filter(l => l !== listener);
    return this;
};

EventEmitter.prototype.removeAllListeners = function (type) {
    if (!this._events) return this;
    if (type) delete this._events[type];
    else this._events = {};
    return this;
};

EventEmitter.prototype.once = function (type, listener) {
    const wrapper = (...args) => {
        this.removeListener(type, wrapper);
        listener.apply(this, args);
    };
    return this.on(type, wrapper);
};

EventEmitter.EventEmitter = EventEmitter;

export { EventEmitter };
export default EventEmitter;
