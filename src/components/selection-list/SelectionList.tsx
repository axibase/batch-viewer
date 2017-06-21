import * as React from "react";
import * as classNames from "classnames";

import { Option, OptionProps } from "./Option";
import { Debug } from "../../debug";

import "./SelectionList.less";

export interface SelectionListProps {
    expanded?: boolean;
    itemsLabel?: string;
    numSelected?: number;
    onChange?: (selection: string[]) => void;
    options: string[];
}

export interface SelectionListState {
    expanded: boolean;
    selection: string[];
}

type Props = SelectionListProps;
type State = SelectionListState;

export class SelectionList extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            expanded: !!props.expanded,
            selection: [],
        }

        this.selectAll = this.selectAll.bind(this);
        this.toggleCollapse = this.toggleCollapse.bind(this);
        this.toggleOption = this.toggleOption.bind(this);
    }

    public render() {
        Debug.info("Selection list of '%s' rendered", this.props.itemsLabel || "items");
        let options = this.renderOptions();
        return (
            <div className={this.className}>
                <Header
                    onClick={this.toggleCollapse}
                    numSelected={this.selectionSize}
                    itemsLabel={this.props.itemsLabel}
                />
                {
                    this.state.expanded && (
                        <div className="filter-multiselect__options">
                            <ul className="filter-multiselect__option-list">
                                {options}
                            </ul>
                        </div>
                    )
                }
            </div>
        )
    }

    private get selectionSize() {
        let numSelected = this.props.numSelected;
        if (numSelected === undefined) {
            return this.state.selection.length;
        }
        return numSelected;
    }

    private get className() {
        return classNames({
            "collapsed": !this.state.expanded,
            "filter-multiselect": true,
        });
    }

    private renderOptions() {
        if (!this.state.expanded) {
            return [];
        };

        let options = [];
        if (this.props.options.length > 0) {
            options.push(
                <SelectAll key="__selectall" onSelected={this.selectAll} />
            );
        }
        for (let option of this.props.options) {
            let selected = this.state.selection.indexOf(option) >= 0;
            options.push(
                <Option
                    key={option + (selected ? "$selected" : "")}
                    onChange={this.toggleOption}
                    selected={selected}
                    value={option}
                />
            );
        }
        return options;
    }

    private selectAll() {
        this.setState((_, props) => {
            let all = [...props.options];
            this.handleChange(all);
            return { selection: all }
        });
    }

    private toggleOption(option: string, selected: boolean) {
        this.setState((state, props) => {
            let { selection } = state;
            if (selected) {
                selection.push(option)
            } else {
                let idx = state.selection.indexOf(option);
                if (idx < 0) {
                    Debug.error("Option '%s' toggled off, but not present in selection", option, state.selection);
                }
                selection.splice(idx, 1);
            }
            this.handleChange(selection);
            return { selection }
        })
    }

    private handleChange(selection) {
        if (this.props.onChange) {
            this.props.onChange.call(void 0, selection);
        }
    }

    private toggleCollapse() {
        this.setState(state => {
            let expanded = !state.expanded;
            return { expanded };
        });
    }

    private createDefaultOptionState() { }
}


interface HeaderProps {
    itemsLabel?: string;
    numSelected: number;
    onClick?: () => void;
}

const Header = (props: HeaderProps) => {
    let label = props.itemsLabel || "items"
    let numSelected = (
        <span className="filter-multiselect__count-selected">
            {props.numSelected}
        </span>
    );

    return (
        <div
            className="filter-multiselect__header"
            onClick={props.onClick}
        >
            <h3>
                Selected {numSelected} {label}
            </h3>
        </div>
    )
}



interface SelectAllProps {
    onSelected?: () => void;
}

const SelectAll = (props: SelectAllProps) => (
    <li>
        <a href="#" onClick={props.onSelected}>Select all</a>
    </li>
);
