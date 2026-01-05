function Buffer(arg, encodingOrOffset, length) {
    if (typeof arg === 'number') {
        return new Uint8Array(arg);
    }
    return new Uint8Array(arg);
}

Buffer.alloc = (size) => new Uint8Array(size);
Buffer.allocUnsafe = (size) => new Uint8Array(size);
Buffer.from = function (data, encoding) {
    if (typeof data === 'string') {
        return new TextEncoder().encode(data);
    }
    return new Uint8Array(data);
};

Buffer.isBuffer = function (obj) {
    return obj != null && (obj._isBuffer === true || obj instanceof Uint8Array);
};

Buffer.concat = function (list, totalLength) {
    if (totalLength === undefined) {
        totalLength = list.reduce((acc, curr) => acc + curr.length, 0);
    }
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const buf of list) {
        result.set(buf, offset);
        offset += buf.length;
    }
    return result;
};

// Satisfy some checks
Uint8Array.prototype._isBuffer = true;

export { Buffer };
export default Buffer;
