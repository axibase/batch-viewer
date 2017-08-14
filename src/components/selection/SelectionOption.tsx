import React from "react";

export interface Option {
    id: string;
    value: string;
    data?: any;
}

export interface ObservableOption extends Option {
    selected: boolean;
    onChange: (id: string, on: boolean) => void;
}

export function SelectionOption({id, value, selected, onChange}: ObservableOption) {
    return (
        <option value={id}>{value}</option>
    );
};
