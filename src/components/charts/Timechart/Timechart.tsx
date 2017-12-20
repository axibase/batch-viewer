import React, { Component } from "react";

import Measure from "react-measure";
import TimechartPlot from "./TimechartPlot";

export interface Series {
    color: string;
    label: string;
    metric: string;
    entity: string;
    timeoffset: number;
    interpolate?: {
        function: string,
        period: {
            count: string,
            unit: string,
            align: string,
            timezone: string,
            boundary: string,
            fill: string
        }
    },
    stepline: boolean
}

export interface TimechartProps {
    series: Series[];
    endTime: number;
    startTime: number;
}

type Props = TimechartProps;

export class Timechart extends Component<Props, any> {
    private approxLegendHeight: number;

    private style: React.CSSProperties = {
        height: "790px",
    };

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
        <div ref={measureRef} className="pt-card pt-elevation-0" style={this.style}>
            <TimechartPlot
                width={contentRect.bounds.width  - 48}
                height={this.approxLegendHeight + 720}
                {...this.props}
            />
        </div>
    );
}
