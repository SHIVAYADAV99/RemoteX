import EventEmitter from './events';
import inherits from './inherits';

function Stream() {
    EventEmitter.call(this);
}

inherits(Stream, EventEmitter);

Stream.prototype.pipe = function (dest) {
    const source = this;
    source.on('data', chunk => dest.write(chunk));
    source.on('end', () => dest.end());
    return dest;
};

function Duplex(options) {
    Stream.call(this);
}
inherits(Duplex, Stream);

Stream.Duplex = Duplex;
Stream.Stream = Stream;

export { Stream, Duplex };
export default Stream;
