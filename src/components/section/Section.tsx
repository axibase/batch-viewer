import React from "react";

import "./section.less";

export function Section(props) {
    return (
        <div className="axi-section" style={props.style}>
            {props.children}
        </div>
    );
};
