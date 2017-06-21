import React, { Component } from "react";
import { Debug } from "../../debug/index";

import { CopyOptions } from "./CopyOptions";
import { ObservableOption, Option, SelectionOption } from "./SelectionOption";

import "./Selection.less";
import { ClearAll } from "./ClearAll";
import { bounds } from "../../utils/bounds";

export interface SelectionProps {
    options: Option[];
    onChange?: (options: Option[]) => void;
    readonly?: boolean;
}

export interface SelectionState {
    selection: string[];
}

type Props = SelectionProps;
type State = SelectionState;

@bounds("reset", "onOptionChange", "onChange")
export class Selection extends Component<Props, State> {
    private root: HTMLElement;
    private refRoot = (root) => {this.root = root};

    constructor(props: Props) {
        super(props);
        this.state = {
            selection: this.createSelection(props.options),
        }
    }

    public render() {
        let {readonly} = this.props;
        return (
            <div className="axi-select">
                <div className="axi-select-controls">
                    <ClearAll onReset={this.reset} visible={!readonly && this.hasOptions} />
                    <CopyOptions from={this.root} visible={this.hasOptions} />
                </div>
                <div ref={this.refRoot} className="pt-card pt-list-unstyled list-selected__list">
                    {this.hasOptions ? this.selectionOptions : <NothingSelected />}
                </div>
            </div>
        );
    }

    public componentWillReceiveProps({ options }: Props, nextContext: any) {
        if (options === this.props.options) {
            return;
        }
        // Select all incoming options
        const selection = this.createSelection(options);
        this.setState({ selection })
    }

    private reset() {
        this.setState(({selection}) => {
            if (selection.length !== 0) {
                selection = []
                this.props.onChange([]);
            }
            return { selection }
        })
    }

    private createSelection(options: Option[]) {
        return options.map((option) => option.id);
    }

    private get hasOptions(): boolean {
        // tslint:disable-next-line:triple-equals
        return (this.props.options != null) && this.props.options.length > 0;
    }

    private get selectionOptions(): JSX.Element {
        let options = this.props.options.map((option: Option) => (
            <SelectionOption
                key={option.id}
                selected={this.state.selection.includes(option.id)}
                onChange={this.onOptionChange}
                {...option}
            />
        ));
        return (
            <div className="axi-select-container">
                <select multiple value={this.state.selection} onChange={this.onChange}>
                    {options}
                </select>
            </div>
        )
    }

    private onChange(evt) {
        let select: HTMLElement = evt.target;

        let selection = Array
            .from(select.querySelectorAll("option"))
            .filter((option) => option.selected)
            .map((option) => option.value);

        this.setState({selection}, () => {
            const { options, onChange, readonly } = this.props;
            if (!readonly) {
                onChange(options.filter(({id}) => selection.includes(id)));
            }
        })
    }

    private onOptionChange(optionId: string, on: boolean) {
        this.setState(({selection}: State) => {
            if (on) {
                selection = [...selection, optionId]
            } else {
                selection = selection.filter((id) => id !== optionId);
            }
            return { selection }
        }, () => {
            const { options, onChange } = this.props;
            const { selection } = this.state;
            onChange(options.filter(({id}) => selection.includes(id)));
        })
    }
}

export function NothingSelected({ itemName = "item" }) {
    return (
        <div className="axi-select-empty pt-non-ideal-state">
            <div className="pt-non-ideal-state-visual pt-non-ideal-state-icon">
                <span className="pt-icon pt-icon-multi-select" />
            </div>
            <h4 className="pt-non-ideal-state-title">Nothing selected</h4>
        </div>
    )
}
