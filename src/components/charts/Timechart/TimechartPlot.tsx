import React from "react";
import * as  Debug from "../../../debug/index";

import { initializeWidget } from "../../../charts/Timechart";
import { TimechartProps } from "./Timechart";

import DEFAULT_CONFIG from "./testconfig.js";

export interface TimechartPlotProps extends TimechartProps {
    height: number;
    width: number;
}

export class TimechartPlot extends React.Component<TimechartPlotProps, any> {
    private widget: any;
    private widgetRoot: Element;

    public render() {
        return (
            <div
                className="widget-root"
                ref={this.refRoot}
            />
        )
    }

    public componentDidMount() {
        this.drawWidget();
    }

    public shouldComponentUpdate(nextProps, nextState) {
        const { props } = this;
        if (isNaN(nextProps.width) || isNaN(nextProps.height)) { return false };
        if (nextProps.startTime !== props.startTime) { return true };
        if (nextProps.endTime !== props.endTime) { return true };
        if (nextProps.series !== props.series) {
            return nextProps.series.length !== 0 || props.series.length !== 0;
        };
        return false;
    }

    public componentDidUpdate() {
        this.drawWidget()
    }

    public componentWillReceiveProps(nextProps: TimechartPlotProps) {
        // If size changed -- resize
        const { width, height } = this.props;
        if (width !== nextProps.width || height !== nextProps.height) {
            if (isNaN(nextProps.height) || isNaN(nextProps.width)) { return; }
            if (nextProps.height <= 0 || nextProps.width <= 0) { return; }
            if (this.widget) {
                this.widget.resize({
                    height: nextProps.height,
                    width: nextProps.width,
                })
            }
        }
    }

    public componentWillUnmount() {
        if (this.widget) {
            this.widget.destroy();
            this.widget = void 0;
        }
    }

    private drawWidget() {
        const {
            endTime,
            height,
            series,
            startTime,
            width,
        } = this.props;

        if (this.widget) {
            this.widget.destroy();
        }

        const root = this.widgetRoot;
        // tslint:disable-next-line:triple-equals
        if (!root) { return; }
        root.innerHTML = "";

        if (!series || series.length === 0 || !width || width <= 0) {
            return;
        }

        Debug.info("Timechart :: width =", width);

        const config = Object.assign(DEFAULT_CONFIG, {
            series: series.map((batch) => Object.assign({
                entity: "nurswgvml007",
                metric: "cpu_busy",
            }, batch)),
        }, {
           endtime: endTime || Date.now(),
           initSize: {width, height},
           starttime: startTime || Date.now() - 3600 * 1000,
        })
        this.widget = initializeWidget(config, root);
    }

    private refRoot = (root) => {
        this.widgetRoot = root;
    }
}

export default TimechartPlot;
