import React from "react";
import { Debug } from "../../debug";

import { MultiSelect } from "../../components/multiselect";
import { Aside, Content, Section } from "../../components/section";
import { Option, Selection } from "../../components/selection";

export interface AssetSelectorState {
    sites: string[];
    selectedSites: string[];
    collapsed: boolean;
    buildings: string[];
    selectedBuildings: string[];
    selectedAssets: Asset[];
    assetOptions: Option[];
}

export interface AssetSelectorProps {
    assets: Asset[];
    onAssetSelectionChange?: (assets: Asset[]) => void;
}

type Props = AssetSelectorProps;
type State = AssetSelectorState;

export class AssetSelector extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            assetOptions: [],
            buildings: [],
            collapsed: false,
            selectedAssets: [],
            selectedBuildings: [],
            selectedSites: [],
            sites: getDistinct(props.assets, (unit) => unit.site),
        };

        this.filterSites    = this.filterSites.bind(this);
        this.filterBuildings = this.filterBuildings.bind(this);
        this.toggleCollapse = this.toggleCollapse.bind(this);
        this.onAssetSelectionChange = this.onAssetSelectionChange.bind(this);
    }

    public componentWillMount() {
        const savedSites = localStorage.getItem("axi-demo-selected-sites");
        Debug.info("Loaded site selection:", savedSites);

        const savedBuildings = localStorage.getItem("axi-demo-selected-buildings");
        Debug.info("Loaded building selection:", savedBuildings);

        const selectedSites = savedSites ? savedSites.split(",") : [];
        const selectedBuildings = savedBuildings ? savedBuildings.split(",") : [];

        this.filterSites(selectedSites);
        this.filterBuildings(selectedBuildings);
    }

    public render() {
        return (
            <Section>
                <Content title="Location" collapsed={this.state.collapsed} onCollapse={this.toggleCollapse}>
                    <div className="pt-card">
                        <MultiSelect
                            sorted
                            label="Site"
                            default="Select site"
                            entries={this.state.sites}
                            selected={this.state.selectedSites}
                            onChange={this.filterSites}
                        />
                        <MultiSelect
                            sorted
                            label="Building"
                            default="Select building"
                            entries={this.state.buildings}
                            selected={this.state.selectedBuildings}
                            onChange={this.filterBuildings}
                        />
                    </div>
                </Content>
                <Aside title="Assets" collapsed={this.state.collapsed}>
                    <Selection
                        options={this.state.assetOptions}
                        onChange={this.onAssetSelectionChange}
                    />
                </Aside>
            </Section>
        )
    }

    private toggleCollapse() {
        this.setState(({collapsed}) => ({collapsed: !collapsed}));
    }

    private createAssetOptions(assets: Asset[]): Option[] {
        return assets.map((asset) => ({
            data: asset,
            id: asset.unitId,
            value: asset.unitId,
        }));
    }

    private onAssetSelectionChange(options: Option[]) {
        const assets = options.map((option) => option.data);
        this.handleSelectionChange(assets);
    }

    private filterBuildings(buildings: string[]) {
        this.setState((state: State, props: Props) => {
            const selectedAssets = filterAssets(props.assets, state.selectedSites, buildings);
            const selectedBuildings = buildings.slice();
            const assetOptions = this.createAssetOptions(selectedAssets);

            Debug.table("Top Level :: Selected buildings", buildings);
            this.handleSelectionChange(selectedAssets, props);

            localStorage.setItem("axi-demo-selected-buildings", buildings.join(","));
            Debug.info("TopLevel :: Saved building selection:", buildings.join(","));

            return {
                assetOptions,
                selectedAssets,
                selectedBuildings,
            }
        })
    }

    private filterSites(sites: string[]) {
        let selectionChanged = false;
        this.setState((state: State, props: Props) => {
            const selectedSites = sites.slice();
            const unitsBySite = filterAssets(props.assets, sites);
            const buildings = getDistinct(unitsBySite, (unit) => unit.building);

            const newState: Partial<State> = {
                assetOptions: [],
                buildings,
                selectedSites,
            }

            if  (state.selectedBuildings.length > 0) {
                newState.selectedBuildings = [];
            }

            if  (state.selectedAssets.length > 0) {
                selectionChanged = true;
                newState.selectedAssets = [];
            }

            return newState;
        }, () => {
            const {
                selectedAssets,
                selectedBuildings,
                selectedSites,
            } = this.state;

            localStorage.setItem("axi-demo-selected-sites", selectedSites.join(","));
            Debug.info("AssetSelector :: Saved site selection:", selectedSites.join(","));
            localStorage.setItem("axi-demo-selected-buildings", selectedBuildings.join(","));
            Debug.info("AssetSelector :: Saved buildings:", selectedBuildings.join(","));

            if (selectionChanged) {
                this.handleSelectionChange(selectedAssets);
            }
        });
    }

    private handleSelectionChange(units: Asset[], props?: Props) {
        props = props || this.props;
        Debug.table("TopLevel :: Unit selection changed", units);
        if (props.onAssetSelectionChange) {
            props.onAssetSelectionChange(units)
        }
    }
}

function filterAssets(units: Asset[], sites?: string[], buildings?: string[]): Asset[] {
    const selection = [];
    for (const unit of units) {
        const shouldTake = (!sites || sites.includes(unit.site))
            && (!buildings || buildings.includes(unit.building));

        if (shouldTake) {
            selection.push(unit);
        }
    }
    return selection;
}

function getDistinct<T>(data: T[]): T[];
function getDistinct<T, V>(data: T[], keyFunc: (data: T) => V): V[];
function getDistinct(data: any[], keyFunc?: (data) => any): any[] {
    const uniques = new Set();
    for (const entry of data) {
        uniques.add(keyFunc ? keyFunc(entry) : entry);
    }
    return Array.from(uniques);
}
