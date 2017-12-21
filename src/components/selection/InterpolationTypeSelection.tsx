import React, {Component} from "react";
import {Option} from "./SelectionOption";

import "./InterpolationSelection.less";

export interface SelectionProps {
    options: Option[];
    value: string | string[];
    onChange?: (options: Option[]) => void;
    readonly?: boolean;
}

type Props = SelectionProps;

export class InterpolationTypeSelection extends Component<Props> {

    public render() {
        return (
            <div id="InterpolationTypeSelection">
                {this.selectionOptions}
            </div>
        );
    }

    private onChange = (evt) => {
        const {options, onChange, readonly} = this.props;
        if (!readonly) {
            onChange(options.filter(({id}) => evt.target.value === id));
        }
    };

    private get selectionOptions(): JSX.Element {
        const options = this.props.options.map((option: Option) => (
                <label>
                    <input type="radio" name="radioInterpolationType" value={option.id} defaultChecked={this.props.value === option.id}
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
