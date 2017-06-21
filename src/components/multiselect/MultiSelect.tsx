import React from "react";

import "./multiselect.less";

function getMultiselectValue(select) {
    const options = select.querySelectorAll("option");
    return Array
        .from<HTMLOptionElement>(options)
        .filter((option) => option.selected)
        .map((option) => option.value);
}

function createOptions(entries: any[], keyFunc, format, sorted) {
    let options = entries.map((entry) => {
        return {
            label: format ? format(entry) : entry,
            value: keyFunc ? keyFunc(entry) : entry,
        }
    });
    if (sorted) {
        options = options.sort((a, b) => a.label > b.label ? 1 : a.label === b.label ? 0 : -1);
    }
    return options.map(({ value, label }) => (
        <option
            key={value}
            value={value}
        >
            {label}
        </option>
    ))
}

export const MultiSelect = (props) => (

    <div className="axi-multiselect">
        <label className="pt-label">
            {props.label}
            <div>
                <select
                    multiple
                    onChange={(evt) => {props.onChange(getMultiselectValue(evt.target))}}
                    value={props.selected || []}
                >
                    {
                        props.default && (
                        <option default disabled hidden>
                            {props.default}
                        </option>
                        )
                    }
                    {
                        createOptions(props.entries, props.keyFunc, props.format, props.sorted)
                    }
                </select>
            </div>
        </label>
    </div>
);
