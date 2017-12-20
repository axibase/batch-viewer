import React from "react";
import {reduceMax, reduceMin} from "../../utils";

import {Timechart} from "../../components/charts";
import {Aside, Content, Section} from "../../components/section";
import {Option, Selection,} from "../../components/selection";
import {InterpolationIntervalSelection} from "../../components/selection/InterpolationIntervalSelection";
import {InterpolationTypeSelection} from "../../components/selection/InterpolationTypeSelection";


export interface MainChartState {
    selectedLabels: string[];
    selectedInterpolationInterval: any;
    selectedInterpolationType: string;
    labelOptions: Option[];
    interpolationIntervalOptions: Option[];
    interpolationTypeOptions: Option[];
    collapsed: boolean;
    interpolateEnabled: boolean,
    series: any;
    deferredSeries: any;
}

export interface MainChartProps {
    labels: string[];
    batches: Batch[];
    interpolationIntervals: any[];
    interpolationTypes: string[];
}

type Props = MainChartProps;
type State = MainChartState;

export class MainChart extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            labelOptions: this.createLabelOptions(props.labels),
            interpolationIntervalOptions: this.createInterpolationIntervalOptions(props.interpolationIntervals),
            interpolationTypeOptions: this.createInterpolationOptions(props.interpolationTypes),
            selectedLabels: props.labels,
            selectedInterpolationInterval: props.interpolationIntervals[5],
            selectedInterpolationType: props.interpolationTypes[0],
            collapsed: false,
            interpolateEnabled: false,
            series: this.createSeries(props.batches, props.labels, false, props.interpolationIntervals[0], props.interpolationTypes[0]),
            deferredSeries: void 0,
        };

        this.onMetricsChange = this.onMetricsChange.bind(this);
        this.onInterpolateIntervalChange = this.onInterpolateIntervalChange.bind(this);
        this.onInterpolateTypeChange = this.onInterpolateTypeChange.bind(this);
        this.toggleCollapse = this.toggleCollapse.bind(this);
    }

    public render() {
        let title = "Timechart";
        if (this.state.series && this.state.series.startTime) {
            let start = new Date(this.state.series.startTime);
            if (start.toISOString) {
                title += ` (base time: ${start.toISOString()})`;
            } else {
                title += ` (base time: ${start})`;
            }
        }
        return (
            <Section>
                <Content title={title} collapsed={this.state.collapsed} onCollapse={this.toggleCollapse}>
                    <Timechart
                        {...this.state.series}
                    />
                </Content>
                <Aside title="Metrics" collapsed={this.state.collapsed}>
                    <label>Interpolation <input type="checkbox" name="Interpolation"
                                                onChange={this.onInterpolateChange}/>
                    </label>
                    <div hidden={!this.state.interpolateEnabled}>
                        <label className="label-interp-type">Function </label>

                        <InterpolationTypeSelection
                            options={this.state.interpolationTypeOptions}
                            onChange={this.onInterpolateTypeChange}
                            value={this.state.selectedInterpolationType}
                        />
                        <div></div>
                        <label>Period</label>
                        <InterpolationIntervalSelection
                            options={this.state.interpolationIntervalOptions}
                            onChange={this.onInterpolateIntervalChange}
                            value={this.state.selectedInterpolationInterval}
                        />
                    </div>
                    <Selection
                        options={this.state.labelOptions}
                        onChange={this.onMetricsChange}
                        value={this.state.selectedLabels}
                    />
                </Aside>
            </Section>

        )
    }

    public componentWillReceiveProps(nextProps) {
        if (this.state.collapsed) {
            this.setState({deferredSeries: this.createSeries(nextProps.batches)})
        } else {
            this.setState({series: this.createSeries(nextProps.batches)})
        }
    }

    private onInterpolateChange = (e) => {
        const interpolateEnabled = e.target.checked;
        this.setState({
            interpolateEnabled: interpolateEnabled,
            series: this.createSeries(undefined, undefined, interpolateEnabled)
        });
    };

    private toggleCollapse = () => {
        this.setState((state) => {
            return {
                collapsed: !state.collapsed,
                series: state.deferredSeries || state.series,
                deferredSeries: void 0,
            };
        });
    };

    private onMetricsChange(options: Option[]) {
        const metrics = options.map((option) => option.data);
        this.setState((state, props) => ({
            selectedLabels: metrics,
            series: this.createSeries(props.batches, metrics),
        }));
    }

    private onInterpolateIntervalChange(options: Option[]) {
        const interpolation = options.map((option) => option.data)[0];
        this.setState(() => ({
            selectedInterpolationInterval: interpolation,
            series: this.createSeries(undefined, undefined, undefined, interpolation)
        }));
    }

    private onInterpolateTypeChange(options: Option[]) {
        const interpolation = options.map((option) => option.data)[0];
        this.setState(() => ({
            selectedInterpolationType: interpolation,
            series: this.createSeries(undefined, undefined, undefined, undefined, interpolation)
        }));
    }

    private createLabelOptions(labels: string[]): Option[] {
        return labels.map((label) => ({
            data: label,
            id: label,
            value: label,
        }));
    }

    private createInterpolationOptions(interpolations: string[]): Option[] {

        return interpolations.map((interpolation) => ({
            data: interpolation,
            id: interpolation,
            value: interpolation,
        }));
    }

    private createInterpolationIntervalOptions(interpolations: any[]): Option[] {

        return interpolations.map((interpolation) => ({
            data: interpolation,
            id: interpolation.label,
            value: interpolation.label,
        }));
    }

    private createSeries(batches = this.props.batches, labels = this.state.selectedLabels, interpolateEnabled = this.state.interpolateEnabled, interpolationInterval = this.state.selectedInterpolationInterval, interpolationType = this.state.selectedInterpolationType) {
        if (batches.length === 0 || labels.length === 0) {
            return {
                endTime: 0,
                series: [],
                startTime: 0,
            }
        }
        const assets = dedupe(batches.map((batch) => batch.unit));

        const startTime = reduceMin(batches, (batch) => batch.startAt);
        const range = reduceMax(batches, (batch) => batch.endAt - batch.startAt);
        const endTime = startTime + range;
        const series = [];
        for (const l of labels) {
            for (const batch of batches) {
                const unitId = assets.length > 1 ? batch.unit + ":" : "";
                const label = labels.length > 1 ? l + ":" : "";
                const batchId = batch.batchId;
                batch.metrics.forEach(metric => {
                    if (l === metric.label) {
                        let s = {
                            entity: batch.unit,
                            label: unitId + label + batchId,
                            metric: metric.name,
                            timeoffset: startTime - batch.startAt,
                        };
                        if (interpolateEnabled) {
                            s['interp'] = {
                                function: interpolationType,
                                period: {
                                    count: interpolationInterval.period.count,
                                    unit: interpolationInterval.period.unit,
                                    align: "START_TIME",
                                    timezone: "UTC",
                                },
                                boundary: "INNER",
                                fill: "true"

                            };
                        }
                        if (metric.interpolate === 'PREVIOUS' && interpolationType === 'AUTO' || interpolationType == 'PREVIOUS') {
                            s['stepline'] = true
                        }
                        series.push(s);

                    }
                });
            }
        }
        return {
            endTime,
            series,
            startTime,
        }
    }
}

function dedupe<T>(array: T[]): T[] {
    return Array.from(new Set(array));
}
