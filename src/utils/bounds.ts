export function bounds(...methods: string[]): ClassDecorator {
    // tslint:disable-next-line:only-arrow-functions
    return function <T extends {new(...args: any[]): any}>(target: T) {
        return class extends target {
            constructor(...args) {
                super(...args);
                for (const name of methods) {
                    const method = this[name];
                    if (typeof method !== "function") {
                        throw new TypeError("Unable to bound non-function member " + name);
                    } else {
                        this[name] = (method as () => void).bind(this);
                    }
                }
            }
        }
    } as any;
}
