import React from "react";

const DEFAULT_STYLE = {};
const COLLAPSED_STYLE = {...DEFAULT_STYLE, display: "none"};

export function Content(props) {
    const style = props.collapsed ? COLLAPSED_STYLE : DEFAULT_STYLE;
    const icon = props.collapsed ? "pt-icon-expand-all" : "pt-icon-collapse-all";
    const collapsible = props.onCollapse;
    return (
        <div className={"pt-card pt-elevation-0 axi-section-content " + (props.collapsed ? "axi-collapsed" : "")}>
            <header>
                {collapsible &&
                <button
                    className={"axi-section-collapse-icon pt-button pt-minimal pt-icon " + icon}
                    onClick={props.onCollapse}
                    title={props.collapsed ? "Expand" : "Collapse"}
                />
                }
                <h4>
                    {props.title}
                </h4>
            </header>
            <div style={style} className="axi-section-content-inner">
                {props.children}
            </div>
        </div>
    );
};
