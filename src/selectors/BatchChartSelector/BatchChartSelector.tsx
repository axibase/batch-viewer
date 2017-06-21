import React from "react";

import { Timeline } from "../../components/charts";
import { Aside, Content, Section } from "../../components/section/index";
import { Selection } from "../../components/selection";
import { ClearAll } from "../../components/selection/ClearAll";
import { Option } from "../../components/selection/SelectionOption";

export interface BatchChartSelectorState {
    selectedBatchOptions: Option[];
    collapsed: boolean;
    forceUpdate?: boolean;
}

export interface BatchChartSelectorProps {
    batches: Batch[];
    selectedBatches: Batch[];
    onBatchSelectionChange?: (batches: Batch[]) => void;
    // TODO: Take this shit out of there!!!
    visible?: boolean;
}

type Props = BatchChartSelectorProps;
type State = BatchChartSelectorState;

export class BatchChartSelector extends React.Component<Props, State> {
    public state: State = {
        collapsed: false,
        selectedBatchOptions: []
    };

    private requestForceUpdate: boolean;

    public render() {
        return (
            <Section>
                <Content
                    title="Batch timeline"
                    collapsed={this.state.collapsed}
                    onCollapse={this.toggleCollapse}
                >
                    <Timeline
                        className="pt-card pt-elevation-0 axi-timeline-container"
                        batches={this.props.batches}
                        onBatchSelectionChange={this.onBatchesChange}
                        selectedBatches={this.props.selectedBatches}
                    />
                    <ClearAll
                        visible
                        className="axi-reset-timeline"
                        onReset={this.reset}
                    />
                </Content>
                <Aside
                    title="Batches"
                    collapsed={this.state.collapsed}
                >
                    <Selection
                        readonly
                        options={this.batchOptions}
                    />
                </Aside>
            </Section>
        )
    }

    public componentWillReceiveProps(nextProps: Props) {
        if (this.state.collapsed) {
            this.requestForceUpdate = true;
        }
    }

    private get batchOptions(): Option[] {
        return this.createBatchOptions(this.props.selectedBatches);
    }

    private toggleCollapse = () => {
        this.setState(({collapsed}) => ({collapsed: !collapsed, forceUpdate: this.requestForceUpdate}));
    }

    private reset = () => {
        if (this.state.selectedBatchOptions.length === 0) {
            return;
        }
        this.setState({ selectedBatchOptions: []}, () => {
            this.props.onBatchSelectionChange([]);
        })
    }

    private onBatchesChange = (batches: Batch[]) => {
        const selectedBatchOptions = this.createBatchOptions(batches);
        if (this.state.selectedBatchOptions.length === 0 && selectedBatchOptions.length === 0) {
            return;
        }
        this.setState({ selectedBatchOptions }, () => {
            this.props.onBatchSelectionChange(batches);
        })
    }

    private createBatchOptions(batches: Batch[]): Option[] {
        return batches.map((batch) => ({
            data: batch,
            id: batch.batchId,
            value: batch.batchId,
        }));
    }
}
