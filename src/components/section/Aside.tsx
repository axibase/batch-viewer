import React from "react";

const DEFAULT_STYLE = {};
const COLLAPSED_STYLE = {...DEFAULT_STYLE, display: "none"};

export function Aside(props) {
    const style = props.collapsed ? COLLAPSED_STYLE : DEFAULT_STYLE;
    return (
        <div className={"pt-card pt-elevation-0 axi-section-aside " + (props.collapsed ? "axi-collapsed" : "")}>
            <header>
                <h4>{props.title}</h4>
            </header>
            <div className="axi-section-aside-inner" style={style}>
                {props.children}
            </div>
        </div>
    );
};
