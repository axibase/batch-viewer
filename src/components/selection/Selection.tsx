import React, {Component} from "react";

import {CopyOptions} from "./CopyOptions";
import {Option} from "./SelectionOption";

import {ClearAll} from "./ClearAll";
import "./Selection.less";

export interface SelectionProps {
    options: Option[];
    value: string | string[];
    onChange?: (options: Option[]) => void;
    readonly?: boolean;
}

type Props = SelectionProps;

export class Selection extends Component<Props> {
    private root: HTMLElement;

    public render() {
        const {readonly} = this.props;
        return (
                <div className="axi-select">
                    <div className="axi-select-controls">
                        <ClearAll onReset={this.reset} visible={!readonly && this.hasOptions}/>
                        <CopyOptions from={this.root} visible={this.hasOptions}/>
                    </div>
                    <div ref={this.refRoot} className="pt-card pt-list-unstyled list-selected__list">
                        {this.hasOptions ? this.selectionOptions : <NothingSelected/>}
                    </div>
                </div>
        );
    }

    private reset = () => {
        this.onSelectionChange([])
    };

    private get hasOptions(): boolean {
        return this.props.options.length > 0;
    }

    private get selectionOptions(): JSX.Element {
        const options = this.props.options.map((option: Option) => (
            <option key={option.id} value={option.id}>{option.value}</option>
        ));
        return (
            <div className="axi-select-container">
                <select multiple value={this.props.value} onChange={this.onChange}>
                    {options}
                </select>
            </div>
        )
    }

    private onChange = (evt) => {
        const select: HTMLElement = evt.target;

        const selection = Array
            .from(select.querySelectorAll("option"))
            .filter((option) => option.selected)
            .map((option) => option.value);

        this.onSelectionChange(selection);
    };

    private onSelectionChange(value: string[]) {
        const {options, onChange, readonly} = this.props;
        if (!readonly) {
            onChange(options.filter(({id}) => value.includes(id)));
        }
    }

    private refRoot = (root) => {
        this.root = root
    };
}

export function NothingSelected({itemName = "item"}) {
    return (
        <div className="axi-select-empty pt-non-ideal-state">
            <div className="pt-non-ideal-state-visual pt-non-ideal-state-icon">
                <span className="pt-icon pt-icon-multi-select"/>
            </div>
            <h4 className="pt-non-ideal-state-title">Nothing selected</h4>
        </div>
    )
}
