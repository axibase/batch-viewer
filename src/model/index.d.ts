declare interface Asset {
    unitId: string;
    site: string;
    building: string;
}

declare interface Batch {
    unit: string;
    batchId: string;
    startAt: number;
    endAt: number;
    procedures: Procedure[];
    metrics: Metric[];
}

declare interface Procedure {
    name: string;
    at: number;
    to: number;
}

declare interface Metric {
    name: string;
    label: string;
    interpolate: string;
}