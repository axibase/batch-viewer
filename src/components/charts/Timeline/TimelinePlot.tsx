import React from "react";

import { BatchTimeline } from "../../../charts/Timeline";
import { TimelineProps } from "./Timeline";

import * as Debug from "../../../debug";
import "./Timeline.less"

interface TimelinePlotProps extends TimelineProps {
    width: number;
}

type Props = TimelinePlotProps;

export class TimelinePlot extends React.Component<Props, any> {
    private timeline: BatchTimeline;
    private timelineRoot: Element;

    public render() {
        return (
            <div
                className="batch-timeline-root"
                ref={this.refRoot}
            />
        )
    }

    public componentWillReceiveProps(nextProps, nextContext) {
        if (this.props.selectedBatches !== nextProps.selectedBatches) {
            Debug.info("TimelinePlot :: should select batches []")
            this.selectBatches(nextProps.selectedBatches);
        }
        if (this.props.width !== nextProps.width) {
            if (isNaN(nextProps.width)) { return; }
            if (nextProps.width <= 0) { return; }
            if (this.timeline) {
                this.timeline.updateWidth(nextProps.width);
            }
        }
    }

    public shouldComponentUpdate(nextProps: Readonly<Props>, nextState: any) {
        const { props } = this;
        if (isNaN(nextProps.width)) { return false };
        if (nextProps.batches !== props.batches) {
            return nextProps.batches.length !== 0 || props.batches.length !== 0;
        };
        return false;
    }

    public componentDidMount() {
        this.drawBatchTimeline();
    }

    public componentDidUpdate() {
        this.drawBatchTimeline();
    }

    private refRoot = (root) => {
        this.timelineRoot = root;
    }

    private drawBatchTimeline() {
        Debug.info("TimelinePlot :: updates")
        const root = this.timelineRoot;
        if (!root) {
            return;
        }
        if (this.timeline) {
            this.timeline.destroy();
        }

        const {
            batches,
            onBatchSelectionChange,
            selectedBatches,
            width,
        } = this.props;

        if (!batches || batches.length === 0) {
            return;
        }

        this.timeline = new BatchTimeline(root, batches);
        if (width) {
            this.timeline.width = width;
        }
        if (onBatchSelectionChange) {
            this.timeline.onBatchSelectionChange = onBatchSelectionChange;
        }
        if (selectedBatches) {
            this.timeline.selectedBatchList.setSelection(selectedBatches, true);
        }
        this.timeline.draw();
    }

    private selectBatches(selectedBatches) {
        if (this.timeline) {
            this.timeline.selectedBatchList.setSelection(selectedBatches, true);
            Debug.info("TimelinePlot :: selected batches " + selectedBatches.join(","));
            this.timeline.drawPlot();
            this.timeline.drawBrush();

            // this.timeline.drawPlotBatches();
        }
        Debug.info("TimelinePlot :: no batch")
    }
}

export default TimelinePlot;
