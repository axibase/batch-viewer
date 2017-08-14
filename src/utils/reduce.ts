export function reduceMin<T, K extends keyof T>(array: T[], key: K): T[K];
export function reduceMin<T, V extends number>(array: T[], key: (entry: T) => V): V;
export function reduceMin(array, key) {
    if (typeof key === "function") {
        return array.reduce((min, item) => Math.min(min, key(item)), Infinity);
    }
    return array.reduce((min, item) => Math.min(min, item[key]), Infinity);
}

export function reduceMax<T, K extends keyof T>(array: T[], key: K): T[K];
export function reduceMax<T, V extends number>(array: T[], key: (entry: T) => V): V;
export function reduceMax(array, key) {
    if (typeof key === "function") {
        return array.reduce((max, item) => Math.max(max, key(item)), -Infinity);
    }
    return array.reduce((max, item) => Math.max(max, item[key]), -Infinity);
}
