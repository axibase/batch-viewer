import React from "react";
import { Debug } from "../../debug/index";
import { reduceMax, reduceMin } from "../../utils";
import { bounds } from "../../utils/bounds";

import Measure from "react-measure";
import { Timechart } from "../charts/Timechart";
import { Timeline } from "../charts/Timeline";

import { AssetSelector, BatchChartSelector, MainChart } from "../../selectors";

import "./App.less";

import testBatchInfo from "./batches.json";
import testUnitInfo from "./units.json";

interface AppState {
    units: Asset[];
    batches: Batch[];
    batchesForAssets: Batch[],
    selectedBatches: Batch[];
    selectedAssets: Asset[];
    timelineData: Batch[];
}

type State = AppState;

const metrics = [
    {
        label: "Temperature",
        metric: "disk_used_percent",
    },
    {
        label: "Pressure",
        metric: "cpu_busy",
    },
]

@bounds("onAssetsChange", "onBatchesChange")
export class App extends React.Component<{}, AppState> {
    constructor(props) {
        super(props);
        const units = testUnitInfo;
        const batches = testBatchInfo;

        this.state = {
            batches,
            batchesForAssets: [],
            selectedAssets: [],
            selectedBatches: [],
            timelineData: [],
            units,
        }
    }

    public render() {
        return (
            <div>
                <AssetSelector
                    assets={this.state.units}
                    onAssetSelectionChange={this.onAssetsChange}
                />
                {this.hasSelectedAssets &&
                    <BatchChartSelector
                        batches={this.state.batchesForAssets}
                        selectedBatches={this.state.selectedBatches}
                        onBatchSelectionChange={this.onBatchesChange}
                    />
                }
                {this.hasSelectedBatches &&
                    <MainChart
                        metrics={metrics}
                        batches={this.state.selectedBatches}
                    />
                }
            </div>
        );
    }

    private get hasSelectedAssets() {
        return this.state.selectedAssets.length > 0;
    }

    private get hasSelectedBatches() {
        return this.hasSelectedAssets && this.state.selectedBatches.length > 0;
    }

    private onAssetsChange(selectedAssets: Asset[]) {
        function inAssets({ unit }: Batch) {
            const idMatches = ({ unitId }) => unit === unitId;
            const position = selectedAssets.findIndex(idMatches);
            return position >= 0;
        }

        this.setState(({ batches }: State) => {
            const batchesForAssets = batches.filter(inAssets);
            return {
                batchesForAssets,
                selectedAssets,
                selectedBatches: [],
            };
        }, () => {
            Debug.table("App :: Assets changed", this.state.selectedAssets);
            Debug.table("App :: Batches changed", this.state.batchesForAssets);
        });
    }

    private onBatchesChange(selectedBatches: Batch[]) {
        this.setState({ selectedBatches }, () => {
            Debug.table("App :: Selected batches changed", this.state.selectedBatches);
        });
    }
}
