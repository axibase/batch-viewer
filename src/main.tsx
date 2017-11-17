import "./main.less";

import React from "react";
import ReactDOM from "react-dom";
import * as Debug from "./debug";

import { App } from "./components/app/App";

// Debug.exec(() => {
//     const {whyDidYouUpdate} = require("why-did-you-update")
//     whyDidYouUpdate(React)
// });

const appRoot = document.querySelector("#root");

if (__debug) {
    if (appRoot === null) {
        const badgeStyle = "font-family: monospace;background-color:gray;" +
            "color:black;border-radius:2px;padding:0.3ex 0.2ex 0.2ex 0.2ex";
        Debug.error("NO #root element. Check %cindex.html", badgeStyle)
    }
}

ReactDOM.render(<App />, appRoot);
