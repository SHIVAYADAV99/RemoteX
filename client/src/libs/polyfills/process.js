const processShim = {
    env: { NODE_ENV: 'production' },
    nextTick: (fn, ...args) => setTimeout(() => fn(...args), 0),
    browser: true,
    version: '',
    versions: {},
    on: () => { },
    addListener: () => { },
    once: () => { },
    off: () => { },
    removeListener: () => { },
    removeAllListeners: () => { },
    emit: () => { },
    prependListener: () => { },
    prependOnceListener: () => { },
    listeners: () => [],
    cwd: () => '/',
    platform: 'browser'
};

export default processShim;
export { processShim as process };
