import React from "react";
import * as Debug from "../../debug";

import { AssetSelector, BatchChartSelector, MainChart } from "../../selectors";
import { getAssetFromEntity, getBatchConfigurations, populateProcedures } from "../../utils/series";

import "./App.less";

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
        metric: "axi.temperature",
    },
    {
        label: "Pressure",
        metric: "axi.pressure",
    },
]

export class App extends React.Component<{}, AppState> {
    constructor(props) {
        super(props);
        this.state = {
            batches: [],
            batchesForAssets: [],
            selectedAssets: [],
            selectedBatches: [],
            timelineData: [],
            units: [],
        }
    }

    public componentDidMount() {
        this.loadAtsdEntities((entities) => {
            let assets = entities.map(getAssetFromEntity);
            this.loadBatches(assets, (batches) => {
                this.setState({units: assets, batches});
            });
        });
    }

    public render() {
        return (
            <div>
                {this.assetSelector}
                {this.batchChart}
                {this.mainChart}
            </div>
        );
    }

    private get assetSelector() {
        if (!this.state.units || !this.state.units.length) {
            return;
        }
        return (
            <AssetSelector
                assets={this.state.units}
                onAssetSelectionChange={this.onAssetsChange}
            />
        );
    }

    private get batchChart() {
        if (!this.hasSelectedAssets) { return; }
        return (
            <BatchChartSelector
                batches={this.state.batchesForAssets}
                onBatchSelectionChange={this.onBatchesChange}
            />
        );
    }

    private get mainChart() {
        if (!this.hasSelectedBatches) { return; }
        return (
            <MainChart
                metrics={metrics}
                batches={this.state.selectedBatches}
            />
        );
    }

    private get hasSelectedAssets() {
        return this.state.selectedAssets.length > 0;
    }

    private get hasSelectedBatches() {
        return this.hasSelectedAssets && this.state.selectedBatches.length > 0;
    }

    private onAssetsChange = (selectedAssets: Asset[]) => {
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

    private onBatchesChange = (selectedBatches: Batch[]) => {
        this.setState({ selectedBatches });
        Debug.table("App :: Selected batches changed", this.state.selectedBatches);
    }

    private loadAtsdSeries(entity: string | string[], metric: string, callback: (respData: any[]) => void) {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/v1/series/query", true);
        xhr.onload = () => {
            const body = JSON.parse(xhr.responseText);
            callback(body);
        };
        xhr.onabort = xhr.onerror = xhr.ontimeout = () => {
            Debug.error("Failed to load series");
        };
        if (Array.isArray(entity)) {
            xhr.send(JSON.stringify({
                entities: entity, metric, interval: { count: 1, unit: "MONTH"},
            }));
        } else {
            xhr.send(JSON.stringify({
                entity, metric, interval: { count: 1, unit: "MONTH"},
            }));
        }
    }

    private loadAtsdEntities(callback: (respData: any[]) => void) {
        const xhr = new XMLHttpRequest();
        const expr = "tags.site != '' And tags.building != ''";
        xhr.open("GET", url`/api/v1/entities?expression=${expr}&tags=${"site,building"}`, true);
        xhr.onload = () => {
            const body = JSON.parse(xhr.responseText);
            callback(body);
        };
        xhr.onabort = xhr.onerror = xhr.ontimeout = () => {
            Debug.error("Failed to load series");
        }
        xhr.send();
    }

    private loadBatches(assets: Asset[], callback: (batches: Batch[]) => void) {
        let entities = assets.map(a => a.unitId);
        let batchesResponse: any[];
        let assetResponse: any[][];
        // Load batch Info
        this.loadAtsdSeries(entities, "axi.Unit_BatchID", (resp) => {
            batchesResponse = resp;
            if (assetResponse) {
                let batches = this.joinBatchesAndProcedures(assets, batchesResponse, assetResponse);
                callback(batches);
            }
        });
        this.loadAtsdSeries(entities, "axi.Unit_Procedure", (resp) => {
            assetResponse = resp;
            if (batchesResponse) {
                let batches = this.joinBatchesAndProcedures(assets, batchesResponse, assetResponse);
                callback(batches);
            }
        });
    }

    private joinBatchesAndProcedures(assets: Asset[], batchResponse: any[], procedureResponse: any[]) {
        let map = new Map();
        for (let asset of assets) {
            map.set(asset.unitId, {
                asset,
                batches: [],
                procedures: [],
            })
        };

        for (let group of batchResponse) {
            let join = map.get(group.entity);
            join.batches = getBatchConfigurations(join.asset, group.data);
        }

        for (let group of procedureResponse) {
            let join = map.get(group.entity);
            join.procedures = group.data;
        }
        let result = [];
        map.forEach((v) => {
            let batches = v.batches;
            populateProcedures(batches, v.procedures);
            result = result.concat(batches);
        })
        return result;
    }
}

function url(templates: TemplateStringsArray, ...args: any[]): string {
    const buffer = [templates[0]];
    for (let i = 0; i < args.length;) {
        const value = args[i];
        switch (typeof value) {
            case "number":
                buffer.push(value.toString());
                break;
            case "string":
                buffer.push(encodeURIComponent(value));
                break;
            default:
                throw new TypeError("Only strings and numbers can be a part of url params");
        }
        buffer.push(templates[++i]);
    }

    return buffer.join("");
}
