// https://tc39.github.io/ecma262/#sec-array.prototype.includes
if (!Array.prototype.includes) {
    Object.defineProperty(Array.prototype, "includes", {
        configurable: true,
        value: includes,
        writable: true,
    });

    function includes(searchElement, fromIndex) {
        // tslint:disable-next-line:triple-equals
        if (this == null) {
            throw new TypeError('"this" is null or not defined');
        }

        let o = Object(this);
        // tslint:disable-next-line:no-bitwise
        let len = o.length >>> 0;
        if (len === 0) {
            return false;
        }
        let n = fromIndex | 0;
        let k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
        function sameValueZero(x, y) {
            return x === y || (typeof x === "number" && typeof y === "number" && isNaN(x) && isNaN(y));
        }
        while (k < len) {
            if (sameValueZero(o[k], searchElement)) {
                return true;
            }
            k++;
        }
        return false;
    }
}
