import React, {Component} from "react";
import {Option} from "./SelectionOption";

import "./InterpolationSelection.less";

export interface SelectionProps {
    options: Option[];
    value: string | string[];
    onChange?: (options: Option[]) => void;
    readonly?: boolean;
}

export interface SelectionState {
}

type Props = SelectionProps;
type State = SelectionState;


export class InterpolationTypeSelection extends Component<Props, State> {

    private onChange = (evt) => {
        const {options, onChange, readonly} = this.props;
        if (!readonly) {
            onChange(options.filter(({id}) => evt.target.value === id));
        }
    };

    public render() {
        return (
            <div className="fieldset">
                {this.selectionOptions}
            </div>
        );
    }

    private get selectionOptions(): JSX.Element {
        const options = this.props.options.map((option: Option) => (
                <label>
                    <input type="radio" value={option.id} id={option.id} checked={this.props.value === option.id}
                           onChange={this.onChange}/>
                    {option.value}
                </label>
        ));
        return (
            <div className="radio">
                {options}
            </div>
        )
    }

}

