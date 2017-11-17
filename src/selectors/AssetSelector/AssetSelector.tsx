import React from "react";
import * as Debug from "../../debug";

import { MultiSelect } from "../../components/multiselect";
import { Aside, Content, Section } from "../../components/section";
import { Option, Selection } from "../../components/selection";

export interface AssetSelectorProps {
    assets: Asset[];
    onAssetSelectionChange?: (assets: Asset[]) => void;
}

export interface AssetSelectorState {
    assetOptions: Option[];
    collapsed: boolean;
    selectedAssets: string[];
    selectedBuildings: string[];
    selectedSites: string[];
    sites: string[];
    visibleAssets: Asset[];
    visibleBuildings: string[];
}

type Props = AssetSelectorProps;
type State = AssetSelectorState;

export class AssetSelector extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            assetOptions: [],
            collapsed: false,
            selectedAssets: [],
            selectedBuildings: [],
            selectedSites: [],
            sites: getDistinct(props.assets, (unit) => unit.site),
            visibleAssets: [],
            visibleBuildings: [],
        };
    }

    public componentWillReceiveProps(nextProps: Props, nextCtx) {
        if (nextProps.assets !== this.props.assets) {
            this.setState({sites: getDistinct(nextProps.assets, (unit) => unit.site)})
        }
    }

    public componentWillMount() {
        if (process.env.NODE_ENV === "production") {
            const savedSites = localStorage.getItem("axi-demo-selected-sites");
            Debug.info("Loaded site selection:", savedSites);

            const savedBuildings = localStorage.getItem("axi-demo-selected-buildings");
            Debug.info("Loaded building selection:", savedBuildings);

            const selectedSites = savedSites ? savedSites.split(",") : [];
            const selectedBuildings = savedBuildings ? savedBuildings.split(",") : [];

            if (selectedSites.length === 0) {
                this.filterSites(selectedSites);
                this.filterBuildings(selectedBuildings);
            } else {
                this.doInitialFilter(selectedSites, selectedBuildings);
            }
        }
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
                            entries={this.state.visibleBuildings}
                            selected={this.state.selectedBuildings}
                            onChange={this.filterBuildings}
                        />
                    </div>
                </Content>
                <Aside title="Assets" collapsed={this.state.collapsed}>
                    <Selection
                        options={this.assetOptions}
                        value={this.state.selectedAssets}
                        onChange={this.onAssetSelectionChange}
                    />
                </Aside>
            </Section>
        )
    }

    private get assetOptions(): Option[] {
        return this.state.visibleAssets.map((asset) => ({
            data: asset,
            id: asset.unitId,
            value: asset.unitId,
        }));
    }

    private toggleCollapse = () => {
        this.setState(({collapsed}) => ({collapsed: !collapsed}));
    }

    private onAssetSelectionChange = (options: Option[]) => {
        const assets = options.map((option) => option.data) as Asset[];
        this.handleSelectionChange(assets);
        this.setState({selectedAssets: assets.map((asset) => asset.unitId)})
    }

    private filterSites = (sites: string[]) => {
        const unitsBySite = filterAssets(this.props.assets, sites);
        const visibleBuildings = getDistinct(unitsBySite, (unit) => unit.building);

        localStorage.setItem("axi-demo-selected-sites", sites.join(","));
        Debug.info("AssetSelector :: Saved site selection:", sites.join(","));
        localStorage.setItem("axi-demo-selected-buildings", "");
        Debug.info("AssetSelector :: Saved buildings:", "nothing");

        this.handleSelectionChange([]);

        this.setState({
            selectedAssets: [],
            selectedBuildings: [],
            selectedSites: sites,
            visibleAssets: [],
            visibleBuildings,
        });
    }

    private filterBuildings = (buildings: string[]) => {
        const visibleAssets = filterAssets(this.props.assets, this.state.selectedSites, buildings);
        const selectedBuildings = buildings.slice();
        localStorage.setItem("axi-demo-selected-buildings", buildings.join(","));
        Debug.info("TopLevel :: Saved building selection:", buildings.join(","));

        this.handleSelectionChange([]);

        this.setState({
            selectedAssets: [],
            visibleAssets,
            selectedBuildings,
        });

        Debug.table("Top Level :: Selected buildings", buildings);
    }

    private doInitialFilter(cachedSites: string[], cachedBuildings: string[]) {
        const assets = this.props.assets;
        const sites = this.state.sites;
        const selectedSites = cachedSites.filter((s) => sites.includes(s));

        const unitsBySite = filterAssets(assets, selectedSites);
        const visibleBuildings = getDistinct(unitsBySite, (unit) => unit.building);
        const selectedBuildings = cachedBuildings.filter((b) => visibleBuildings.includes(b));

        const visibleAssets = filterAssets(assets, selectedSites, selectedBuildings);

        this.handleSelectionChange([]);

        this.setState({
            selectedAssets: [],
            selectedBuildings,
            selectedSites,
            visibleAssets,
            visibleBuildings,
        });

        Debug.table("Top Level :: Selected sites restored", selectedSites);
        Debug.table("Top Level :: Selected buildings restored", selectedBuildings);
    }

    private handleSelectionChange(units: Asset[]) {
        Debug.table("AssetSelector :: Unit selection changed", units);
        if (this.props.onAssetSelectionChange) {
            this.props.onAssetSelectionChange(units)
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
