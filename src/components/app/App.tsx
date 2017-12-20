import React from "react";
import * as Debug from "../../debug";

import {AssetSelector, BatchChartSelector, MainChart} from "../../selectors";
import {getAssetFromEntity, getBatchConfigurations, populateProcedures} from "../../utils/series";

import "./App.less";

interface AppState {
    units: Asset[];
    batches: Batch[];
    batchesForAssets: Batch[];
    selectedBatches: Batch[];
    selectedAssets: Asset[];
    timelineData: Batch[];
}

type State = AppState;


export class App extends React.Component<{}, AppState> {

    private labels: string[] = ['Agitator Speed', 'Jacket Temperature', 'Product Temperature'];
    private interpolationIntervals = [
        {
            label: '5 seconds',
            period: {
                count: 5,
                unit: 'SECOND',
            },
        },
        {
            label: '10 seconds',
            period: {
                count: 10,
                unit: 'SECOND',
            },
        },
        {
            label: '15 seconds',
            period: {
                count: 15,
                unit: 'SECOND',
            },
        },
        {
            label: '20 seconds',
            period: {
                count: 20,
                unit: 'SECOND',
            },
        },
        {
            label: '30 seconds',
            period: {
                count: 30,
                unit: 'SECOND',
            },
        },
        {
            label: '1 minute',
            period: {
                count: 1,
                unit: 'MINUTE',
            },
        },
        {
            label: '2 minutes',
            period: {
                count: 2,
                unit: 'MINUTE',
            },
        },
        {
            label: '3 minutes',
            period: {
                count: 3,
                unit: 'MINUTE',
            },
        },
        {
            label: '5 minutes',
            period: {
                count: 5,
                unit: 'MINUTE',
            },
        },
        {
            label: '10 minutes',
            period: {
                count: 10,
                unit: 'MINUTE',
            },
        },
        {
            label: '15 minutes',
            period: {
                count: 15,
                unit: 'MINUTE',
            },
        },
        {
            label: '30 minutes',
            period: {
                count: 30,
                unit: 'MINUTE',
            },
        },
        {
            label: '1 hour',
            period: {
                count: 1,
                unit: 'HOUR',
            },
        },
        {
            label: '2 hours',
            period: {
                count: 2,
                unit: 'HOUR',
            },
        },
        {
            label: '3 hours',
            period: {
                count: 3,
                unit: 'HOUR',
            },
        },
        {
            label: '6 hours',
            period: {
                count: 6,
                unit: 'HOUR',
            },
        },
        {
            label: '8 hours',
            period: {
                count: 8,
                unit: 'HOUR',
            },
        },
        {
            label: '12 hours',
            period: {
                count: 12,
                unit: 'HOUR',
            },
        },
        {
            label: '1 day',
            period: {
                count: 1,
                unit: 'DAY',
            },
        },
    ];
    private interpolationTypes: string[] = ['AUTO', 'LINEAR', 'PREVIOUS'];

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
                this.loadBatchesMetricsByLabels(entities, (metrics) => {
                    for (let batch of batches) {
                        batch.metrics = metrics[batch.unit];
                    }
                });
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
        if (!this.hasSelectedAssets) {
            return;
        }
        return (
            <BatchChartSelector
                batches={this.state.batchesForAssets}
                onBatchSelectionChange={this.onBatchesChange}
            />
        );
    }

    private get mainChart() {
        if (!this.hasSelectedBatches) {
            return;
        }
        return (
            <MainChart
                labels={this.labels}
                batches={this.state.selectedBatches}
                interpolationIntervals={this.interpolationIntervals}
                interpolationTypes={this.interpolationTypes}
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
        function inAssets({unit}: Batch) {
            const idMatches = ({unitId}) => unit === unitId;
            const position = selectedAssets.findIndex(idMatches);
            return position >= 0;
        }

        this.setState(({batches}: State) => {
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
    };

    private onBatchesChange = (selectedBatches: Batch[]) => {
        this.setState({selectedBatches});
        Debug.table("App :: Selected batches changed", this.state.selectedBatches);
    };

    private loadAtsdSeries(entity: string | string[], metric: string, callback: (respData: any[]) => void) {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/v1/series/query", true);
        xhr.onload = () => {
            const body = JSON.parse(xhr.responseText);
            callback(body);
        };
        xhr.onabort = xhr.onerror = xhr.ontimeout = () => {
            Debug.error("Failed to load series");
            callback([]);
        };
        if (Array.isArray(entity)) {
            xhr.send(JSON.stringify({
                entities: entity, metric, interval: {count: 1, unit: "YEAR"},
            }));
        } else {
            xhr.send(JSON.stringify({
                entity, metric, interval: {count: 1, unit: "YEAR"},
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
            Debug.error("Failed to load entities");
        };
        xhr.send();
    }

    private loadEntityMetricsByLabels(entity: string, callback: (respData: any) => void) {
        const xhr = new XMLHttpRequest();
        const expr = this.labels.map(l => "label = '" + l + "'").join(' or ');
        xhr.open("GET", url`/api/v1/entities/${entity}/metrics?expression=${expr}`, true);
        xhr.onload = () => {
            const metrics = JSON.parse(xhr.responseText).map(function (metric) {
                return {label: metric.label, name: metric.name, interpolate: metric.interpolate}
            });
            callback(metrics);
        };
        xhr.onabort = xhr.onerror = xhr.ontimeout = () => {
            Debug.error("Failed to load labels");
            callback([]);
        };
        xhr.send();
    }

    private loadMetricsByExpression(entity: string, callback: (respData: any) => void) {
        const xhr = new XMLHttpRequest();
        const expr = "name like '*:unit_procedure' or name like '*:unit_batchid'";
        xhr.open("GET", url`/api/v1/entities/${entity}/metrics?expression=${expr}`, true);
        xhr.onload = () => {
            let metrics = [];
            // const respData = JSON.parse(xhr.responseText);
            const respData = JSON.parse(xhr.responseText).map(metric => metric.name);
            metrics = metrics.concat(respData.filter(metric => metric.endsWith(':unit_batchid')));
            metrics = metrics.concat(respData.filter(metric => metric.endsWith(':unit_procedure')));
            callback(metrics);
        };
        xhr.onabort = xhr.onerror = xhr.ontimeout = () => {
            Debug.error("Failed to load labels");
            callback([]);
        };
        xhr.send();
    }

    private loadBatchesMetricsByLabels(entities: any[], callback: (respData: any) => void) {
        let batchMetrics = {};
        let reqCounter = entities.length;

        for (let entity of entities) {
            let name = entity.name;
            this.loadEntityMetricsByLabels(name, (metrics) => {
                batchMetrics[name] = metrics;
                if (--reqCounter === 0 || metrics === []) {
                    callback(batchMetrics)
                }
            });
        }
        callback(batchMetrics);
    }

    private loadBatches(assets: Asset[], callback: (batches: Batch[]) => void) {
        let batchList = [];
        const entities = assets.map(a => a.unitId);
        let reqCounter = entities.length;
        for (let entity of entities) {
            this.loadMetricsByExpression(entity, (metrics) => {
                // Load batch Info
                if (metrics.length === 2) {
                    let batchId = metrics[0];
                    let procedure = metrics[1];
                    this.loadAtsdSeries(entity, batchId, (batchesResponse) => {
                        this.loadAtsdSeries(entity, procedure, (assetResponse) => {
                            let batches = this.joinBatchesAndProcedures(assets, batchesResponse, assetResponse);
                            batchList = batchList.concat(batches);
                            if (--reqCounter === 0 || batchesResponse === [] || assetResponse === []) {
                                callback(batchList)
                            }
                        });
                    });

                }
                else {
                    --reqCounter;
                    Debug.info('No batch info for asset:', entity);
                }

            });
        }
    }


    private joinBatchesAndProcedures(assets: Asset[], batchResponse: any[], procedureResponse: any[]) {
        let map = new Map();
        for (let asset of assets) {
            map.set(asset.unitId, {
                asset,
                batches: [],
                procedures: [],
            })
        }
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
        });
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
