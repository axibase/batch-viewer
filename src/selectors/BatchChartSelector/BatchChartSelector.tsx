import React from "react";
import { Debug } from "../../debug";

import Measure from "react-measure";
import { Timeline } from "../../components/charts";
import { Selection } from "../../components/selection";
import { Option } from "../../components/selection/SelectionOption";
import { ClearAll } from "../../components/selection/ClearAll";
import { bounds } from "../../utils/bounds";
import { Section, Content, Aside } from "../../components/section/index";

export interface BatchChartSelectorState {
    selectedBatchOptions: Option[];
    collapsed: boolean;
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

@bounds("reset", "toggleCollapse")
export class BatchChartSelector extends React.Component<Props, State> {
    private static readonly DEFAULT = {};
    private static readonly HIDDEN = Object.assign({}, BatchChartSelector.DEFAULT, { display: "none" });

    constructor(props: Props) {
        super(props);
        this.state = {
            selectedBatchOptions: [],
            collapsed: false,
        };

        this.onBatchesChange = this.onBatchesChange.bind(this);
    }

    public render() {
        const style = this.props.visible ? BatchChartSelector.DEFAULT : BatchChartSelector.HIDDEN;
        return (
            <Section>
                <Content title="Batch timeline" onCollapse={this.toggleCollapse} collapsed={this.state.collapsed}>
                    <Timeline
                        className="pt-card pt-elevation-0 axi-timeline-container"
                        batches={this.props.batches}
                        selectedBatches={this.props.selectedBatches}
                        onBatchSelectionChange={this.onBatchesChange}
                    />
                    <ClearAll visible={true} onReset={this.reset} className="axi-reset-timeline"/>
                </Content>
                <Aside title="Batches" collapsed={this.state.collapsed}>
                    <Selection
                        readonly
                        options={this.batchOptions}
                    />
                </Aside>
            </Section>
        )
    }

    private toggleCollapse() {
        this.setState(({collapsed}) => ({collapsed: !collapsed}));
    }


    private reset() {
        if (this.state.selectedBatchOptions.length === 0) {
            return;
        }
        this.setState({ selectedBatchOptions: []}, () => {
            this.props.onBatchSelectionChange([]);
        })
    }

    private onBatchesChange(batches: Batch[]) {
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

    private get batchOptions(): Option[] {
        return this.createBatchOptions(this.props.selectedBatches);
    }
}
