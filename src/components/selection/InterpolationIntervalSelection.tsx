import React, {Component} from "react";

import {Option} from "./SelectionOption";

import "./InterpolationSelection.less";



export interface SelectionProps {
    options: Option[];
    value: any;
    onChange?: (options: Option[]) => void;
    readonly?: boolean;
}

export interface SelectionState {
}

type Props = SelectionProps;
type State = SelectionState;

export class InterpolationIntervalSelection extends Component<Props, State> {

    public render() {
        return (
            <div className="axi-select-dropdown">
                {this.hasOptions ? this.selectionOptions : <NothingSelected/>}
            </div>
        )
            ;
    }

    private get hasOptions(): boolean {
        return this.props.options.length > 0;
    }

    private get selectionOptions(): JSX.Element {
        const options = this.props.options.map((option: Option) => (
            <option key={option.value} value={option.value}>{option.value}</option>
        ));
        return (
            <select onChange={this.onChange} defaultValue={options[5].props.value}>
                {options}
            </select>
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

    private onSelectionChange(value: any[]) {
        const {options, onChange, readonly} = this.props;
        if (!readonly) {
            onChange(options.filter(({id}) => value.includes(id)));
        }
    }
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
