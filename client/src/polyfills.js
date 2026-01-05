import { Buffer } from './libs/polyfills/buffer.js';
import { process } from './libs/polyfills/process.js';
import EventEmitter from './libs/polyfills/events.js';
import util from './libs/polyfills/util.js';
import Stream from './libs/polyfills/stream.js';
import inherits from './libs/polyfills/inherits.js';

if (typeof window !== 'undefined') {
    window.global = window;
    window.Buffer = Buffer;
    window.process = process;

    // Ensure EventEmitter is the function
    let EE = EventEmitter;
    if (EE.default) EE = EE.default;
    if (typeof EE !== 'function' && EE.EventEmitter) EE = EE.EventEmitter;
    window.EventEmitter = EE;

    // Handle Stream/Duplex
    let ST = Stream;
    if (ST.default) ST = ST.default;
    window.stream = ST;
    if (ST.Stream) window.Stream = ST.Stream;
    if (ST.Duplex) window.Duplex = ST.Duplex;

    // Util and Inherits
    window.util = util;
    window.inherits = inherits;

    console.log('🚀 Polyfills loaded successfully');
}
