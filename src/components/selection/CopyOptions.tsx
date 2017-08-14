import React from "react";

export function CopyOptions({from, visible = true}) {
    function copyContent() {
        if (!from) {
            return;
        }
        let range: Range;
        try {
            range = document.createRange();
            range.selectNode(from);
            window.getSelection().addRange(range);
            document.execCommand("copy");
        } finally {
            window.getSelection().removeAllRanges();
        }
    }
    const display = visible ? undefined : "none";
    return (
        <button
            className="pt-button pt-minimal pt-icon-duplicate axi-select-copy"
            onClick={copyContent}
            style={{ display }}
            title="Copy to clipboard"
        />
    )
}
