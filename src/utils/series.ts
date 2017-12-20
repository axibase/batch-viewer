export function getAssetFromEntity(entity: any): Asset {
    return {
        unitId: entity.name,
        site: entity.tags.site,
        building: entity.tags.building
    };
}

export function getAvailableSites(assets) {
    let result = new Set();
    for (const {site} of assets) {
        result.add(site);
    }
    return Array.from(result);
}

export function getAvailableBuildings(assets) {
    let result = new Set();
    for (const {building} of assets) {
        result.add(building);
    }
    return  Array.from(result);
}

interface DataSample {
    t?: number;
    d?: string;
    x: string;
}

function getMilliseconds(t: number | undefined, d: string | undefined) {
    if (d !== undefined) {
        return new Date(d).getTime();
    } else {
        return t
    }
}

export function getBatchConfigurations(asset: Asset, seriesData: DataSample[]) {
    let batches: Batch[] = [];
    let activeBatch = {unit: asset.unitId} as Batch;
    for (const {t, d, x} of seriesData) {
        if (x === "Inactive") {
            activeBatch.endAt = getMilliseconds(t, d);
            batches.push(activeBatch);
            activeBatch = {unit: asset.unitId} as Batch;
        } else {
            activeBatch.startAt = getMilliseconds(t, d);
            activeBatch.batchId = x;
        }
    }
    return batches;
}

export function populateProcedures(batches: Batch[], seriesData: DataSample[]) {
    let activeBatch = batches[0];
    let nextBatchIdx = 1;
    let buffer = [];
    let currentProcedure = {} as Procedure;
    for (const {t, d, x} of seriesData) {
        if (!activeBatch) {break; }
        if (x === "Inactive") {
            currentProcedure.to = getMilliseconds(t, d);
            buffer.push(currentProcedure);
            currentProcedure = {} as Procedure;
            activeBatch.procedures = buffer;
            buffer = [];
            activeBatch = batches[nextBatchIdx++];
        } else {
            if (currentProcedure.name) {
                currentProcedure.to = getMilliseconds(t, d);
                buffer.push(currentProcedure);
            }
            currentProcedure = {name: x, at: getMilliseconds(t, d)} as Procedure;
        }
    }
    if (buffer.length) {
        // Last incomplete batch
        activeBatch.procedures = buffer;
    }
}
