import React from "react";
import { reduceMax, reduceMin } from "../../utils";

import { Timechart } from "../../components/charts";
import { Aside, Content, Section } from "../../components/section";
import { Option, Selection } from "../../components/selection";

export interface MainChartState {
    selectedMetrics: Metric[];
    options: Option[];
    collapsed: boolean;
    series: any;
    deferredSeries: any;
}

export interface MainChartProps {
    metrics: Metric[];
    batches: Batch[];
    // TODO: Take this shit out of there!!!
    visible?: boolean;
}

type Props = MainChartProps;
type State = MainChartState;

export class MainChart extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            options: this.createOptions(props.metrics),
            selectedMetrics: props.metrics,
            collapsed: false,
            series: this.createSeries(props.batches, props.metrics),
            deferredSeries: void 0,
        };

        this.onMetricsChange = this.onMetricsChange.bind(this);
        this.toggleCollapse = this.toggleCollapse.bind(this);
    }

    public render() {
        return (
            <Section>
                <Content title="Timechart" collapsed={this.state.collapsed} onCollapse={this.toggleCollapse}>
                    <Timechart
                        {...this.state.series}
                    />
                </Content>
                <Aside title="Metrics" collapsed={this.state.collapsed}>
                    <Selection
                        options={this.state.options}
                        onChange={this.onMetricsChange}
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

    private toggleCollapse = () => {
        this.setState((state) => {
            return {
                collapsed: !state.collapsed,
                series: state.deferredSeries || state.series,
                deferredSeries: void 0,
            };
        });
    }

    private onMetricsChange(options: Option[]) {
        const metrics = options.map((option) => option.data);
        this.setState((state, props) => ({
            selectedMetrics: metrics,
            series: this.createSeries(props.batches, metrics),
        }))
    }

    private createOptions(metrics: Metric[]): Option[] {
        return metrics.map((metric) => ({
            data: metric,
            id: metric.metric,
            value: metric.label,
        }));
    }

    private createSeries(batches = this.props.batches, metrics = this.state.selectedMetrics) {
        if (batches.length === 0 || metrics.length === 0) {
            return {
                endTime: 0,
                series: [],
                startTime: 0,
            }
        }

        const assets = dedupe(batches.map((batch) => batch.unit));

        const startTime = reduceMin(batches, (batch) => batch.startAt);
        const range =     reduceMax(batches, (batch) => batch.endAt - batch.startAt);
        const endTime   = startTime + range;
        const series = [];
        for (const metric of metrics) {
            for (const batch of batches) {
                const unitId = assets.length > 1 ? batch.unit + ":" : "";
                const label = metrics.length > 1 ? metric.label + ":" : "";
                const batchId = batch.batchId;
                series.push({
                    label: unitId + label + batchId,
                    metric: metric.metric,
                    timeoffset: startTime - batch.startAt,
                })

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
