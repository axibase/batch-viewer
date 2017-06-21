// tslint:disable:no-console
// tslint:disable-next-line:no-namespace
export namespace Debug {
    export function info(msg?: any, ...args: any[]) {
        if (__debug) {
            console.log("[INFO]  " + msg, ...args);
        }
    }

    export function table(data: any[]);
    export function table(header: string, data: any[]);
    export function table(header: string | any[], data?: any) {
        if (__debug) {
            if (typeof header !== "string") {
                data = header;
                header = "";
            }
            console.groupCollapsed(`[DEBUG TABLE] ${header} [${data.length}]`);
            if (data.length > 0) {
                try {
                    console.table(data);
                } catch (e) {
                    console.log(data);
                }
            } else {
                console.log("%cEmpty table", "font-style: italic");
            }
            console.groupEnd();
        }
    }

    export function error(msg?: any, ...args: any[]) {
        if (__debug) {
            console.error("[ERROR]  " + msg, ...args);
        }
    }

    export function call<S>(func: () => S): S;
    export function call<S, A1>(func: (this: void,arg: A1) => S, arg: A1): S;
    export function call<S, A1, A2>(func: (this: void, arg1: A1, arg2: A2) => S, arg: A1, arg2: A2): S;
    export function call<S>(func: (this: void, ...args: any[]) => S, ...args: any[]): S;
    export function call<S>(func: (this: void, ...args: any[]) => S, ...args: any[]): S {
        if (__debug) {
            return func.call(void 0, ...args);
        }
    }

    export function exec(func: () => void) {
        Debug.call(func);
    }
}
