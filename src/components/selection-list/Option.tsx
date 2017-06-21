import * as React from "react";
import * as classNames from "classnames";

export interface OptionProps {
    value: string;
    selected?: boolean;
    onChange?: (value: string, toggledOn: boolean) => void;
}

type Props = OptionProps;
type State = any;

export class Option extends React.Component<Props, any> {
    constructor (props: Props) {
        super(props);
        this.state = {
            selected: !!props.selected
        }
        this.toggle = this.toggle.bind(this);
    }   
    public render(): JSX.Element {
        return (
            <li
                onClick={this.toggle}
                className={this.className}
            >
                {this.props.value}
            </li>
        )
    }
    private toggle() {
        this.setState((state, props) => {
            let selected = !state.selected;
            if (props.onChange) {
                props.onChange(props.value, selected);
            }
            return { selected };
        })
    }

    private get className(): string {
        return classNames({
            "filter-multiselect__option": true,
            "selected": this.state.selected,
        });
    }
}