import React, { Component } from "react";

import Measure from "react-measure";
import TimechartPlot from "./TimechartPlot";

export interface Series {
    color: string;
    label: string;
    metric: string;
    entity: string;
    timeoffset: number;
}

export interface TimechartProps {
    series: Series[];
    endTime: number;
    startTime: number;
}

type Props = TimechartProps;

export class Timechart extends Component<Props, any> {
    private approxLegendHeight: number;

    constructor(props: Props) {
        super(props);
        this.approxLegendHeight = Math.ceil(props.series.length / 3) * 13 + 10;
    }

    public render() {
        return (
            <Measure bounds>
                {this.ResponsiveTimechartPlot}
            </Measure>
        )
    }

    private ResponsiveTimechartPlot = ({ measureRef, contentRect }) => (
        <div ref={measureRef} className="pt-card pt-elevation-0">
            <TimechartPlot
                width={contentRect.bounds.width  - 48}
                height={this.approxLegendHeight + 720}
                {...this.props}
            />
        </div>
    );
}
