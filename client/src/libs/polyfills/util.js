import inherits from './inherits';

export { inherits };

export const inspect = (obj) => JSON.stringify(obj, null, 2);
export const deprecate = (fn) => fn;
export const isFunction = (arg) => typeof arg === 'function';
export const isObject = (arg) => typeof arg === 'object' && arg !== null;

export default {
    inherits,
    inspect,
    deprecate,
    isFunction,
    isObject
};
