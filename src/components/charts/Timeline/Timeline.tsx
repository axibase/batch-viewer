import React, { Component } from "react";
import * as Debug from "../../../debug";

import Measure from "react-measure";
import TimelinePlot from "./TimelinePlot";

import "./Timeline.less";

export interface TimelineProps extends React.Props<any> {
    batches: Batch[];
    className?: string;
    onBatchSelectionChange?: (batches: Batch[]) => void;
    selectedBatches?: Batch[];
    forceUpdate?: boolean;
}

type Props = TimelineProps;

export class Timeline extends Component<Props, any> {
    public state = {
        width: 0,
    }

    public render() {
        Debug.info("Timeline :: Redrawn");
        return (
            <Measure bounds onResize={this.updateWidth}>
                {this.ResponsiveTimelinePlot}
            </Measure>
        )
    }

    public shouldComponentUpdate(nextProps: Readonly<Props>, nextState: any) {
        return (
            nextProps.forceUpdate ||
            this.props.batches    !== nextProps.batches ||
            this.props.className  !== nextProps.className ||
            this.props.onBatchSelectionChange  !== nextProps.onBatchSelectionChange ||
            this.props.selectedBatches  !== nextProps.selectedBatches ||
            this.state.width  !== nextState.width && !isNaN(nextState.width)
        )
    }

    private ResponsiveTimelinePlot = ({ measureRef }) => (
        <div ref={measureRef} className={this.props.className} >
            <TimelinePlot
                width={this.state.width}
                {...this.props}
            />
        </div>
    );

    private updateWidth = ({bounds: {width}}) => {
        width -= 48;
        this.setState((state) => {
            if (state.width !== width) {
                return {width};
            }
        });
    }
}
