import React from "react";
import "./InterpolationSelection.less";

export class CheckBoxPanel extends React.Component<any, any> {
    public state = {
        checked: false,
    };

    public onChange = (e) => {
        this.setState({checked: e.target.checked});
    };

    public render() {
        return (
            <div>
                <input type="checkbox" onChange={this.onChange} />
                <label>Interpolation {this.state.checked ? "enabled" : "disabled"}</label>
                <small hidden={!this.state.checked}>Secret</small>
            </div>
        );
    }
}
