import { Buffer } from 'buffer';
import process from 'process';

// Set process and globals early
if (typeof window !== 'undefined') {
    window.process = process;
    window.global = window;
    window.Buffer = Buffer;
}

import EventEmitter from 'events';
import util from 'util';
import Stream from 'stream';
import inherits from 'inherits';

if (typeof window !== 'undefined') {
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
