import React from "react";

export function ClearAll({onReset = (() => {}), visible = true, className = ""}) {
    const display = visible ? undefined : "none";
    if (className) {
        className = "pt-button pt-minimal pt-icon-refresh axi-select-reset " + className;
    } else {
        className = "pt-button pt-minimal pt-icon-refresh axi-select-reset";
    }
    return (
        <button
            className={className}
            onClick={onReset}
            style={{ display }}
            title="Clear"
        />
    )
}
