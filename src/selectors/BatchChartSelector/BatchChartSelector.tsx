import React from "react";

import { Timeline } from "../../components/charts";
import { Aside, Content, Section } from "../../components/section/index";
import { Selection } from "../../components/selection";
import { ClearAll } from "../../components/selection/ClearAll";
import { Option } from "../../components/selection/SelectionOption";

export interface BatchChartSelectorState {
    selectedBatches: Batch[];
    collapsed: boolean;
}

export interface BatchChartSelectorProps {
    batches: Batch[];
    onBatchSelectionChange?: (batches: Batch[]) => void;
}

type Props = BatchChartSelectorProps;
type State = BatchChartSelectorState;

export class BatchChartSelector extends React.Component<Props, State> {
    public state: State = {
        collapsed: false,
        selectedBatches: [],
    };

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
                        onBatchSelectionChange={this.onSelectedBatchesChange}
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
        if (this.props.batches !== nextProps.batches) {
            this.reset();
        }
    }

    private get batchOptions(): Option[] {
        return this.state.selectedBatches.map<Option>((batch) => ({
            data: batch,
            id: batch.batchId,
            value: batch.batchId,
        }));
    }

    private toggleCollapse = () => {
        this.setState(({collapsed}) => ({collapsed: !collapsed}));
    }

    private reset = () => {
        if (this.state.selectedBatches.length === 0) {
            return;
        }
        this.setState({selectedBatches: []}, () => {
            this.props.onBatchSelectionChange([]);
        })
    }

    private onSelectedBatchesChange = (batches: Batch[]) => {
        this.setState({selectedBatches: batches}, () => {
            this.props.onBatchSelectionChange(batches);
        })
    }
}
