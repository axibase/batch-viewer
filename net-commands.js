const ASSET_COUNT = 10;
const SITE_COUNT = 2;
const BUILDING_PER_SITE_COUNT = 2;

const MIN_TIME = new Date("2017-11-15T00:00:00Z");
const MAX_TIME = new Date("2017-11-16T00:00:00Z");

const positiveSpline = (r, m) => (t, l) => x => r * (((x - t) / l) ** 3) + m;
const positiveInvSpline = (r, m) => (t, l) => x => r * ((((x - t) / l) - 1) ** 3) + r + m;
const negativeSpline = (r, m) => (t, l) => x => r * ((1 - ((x - t) / l)) ** 3) + m;
const linear = (r, m) => (t, l) => x => r == 0 ? m : (x - t) * r / l + m;

class SplineHolder {
    constructor() {
        this.splines = [];
    }

    putSpline(t0, t1, metric, splineBuilder) {
        this.splines.push([t0, t1, metric, splineBuilder(t0, t1-t0)])
    }

    getSpline(metric, t) {
        let entry = this.splines.find(([s, e, m, ]) => s <= t && e > t && m === metric);
        return entry && entry[3];
    }
}

console.assert(positiveSpline(19, 1)(100, 10)(100) === 1);
console.assert(positiveSpline(19, 1)(100, 10)(110) === 20);
console.assert(positiveInvSpline(19, 1)(100, 10)(100) === 1);
console.assert(positiveInvSpline(19, 1)(100, 10)(110) === 20);
console.assert(negativeSpline(19, 1)(100, 10)(100) === 20);
console.assert(negativeSpline(19, 1)(100, 10)(110) === 1);
console.assert(linear(19, 1)(100, 10)(100) === 1);
console.assert(linear(19, 1)(100, 10)(110) === 20);
console.assert(linear(-19, 20)(100, 10)(100) === 20);
console.assert(linear(-19, 20)(100, 10)(110) === 1);

let procedures = [
    ['Heating', 10],
    ['Mixing' ,  5],
    ['Brewing', 40],
    ['Cooling', 15],
    ['Inactive', 5]
]

let metrics = [
    ["axi.temperature", {
        "Heating": positiveSpline(55, 30),
        "Mixing": positiveInvSpline(5, 85),
        "Brewing": negativeSpline(10, 80),
        "Cooling": negativeSpline(30, 50),
        "Inactive": linear(-20, 50),
    }],
    ["axi.pressure", {
        "Heating": positiveSpline(12, 10),
        "Mixing": linear(0, 22),
        "Brewing": positiveSpline(3, 22),
        "Cooling": negativeSpline(15, 10),
        "Inactive": linear(0, 10),
    }],
];

let sites = ["svl", "nur"];

let buildings = [["A", "B"],["C", "D"]];

let assets = Array(ASSET_COUNT).fill("").map((_,i) => {
    let site = randIntN(SITE_COUNT);
    let building = randIntN(BUILDING_PER_SITE_COUNT);
    return {
        id: `axi.asset-${i}`,
        site: sites[site],
        building: buildings[site][building],
    }
});
// console.log(assets);

let assetCommands = assets.map(({id, site, building}) => 
    `entity e:${id} t:site=${site} t:building=${building}` 
);

console.log(assetCommands.join("\n"))


let statusCommands = [""]
let batchCommands = [""]
let batchid = 1400;

let dataCommandSplines = []

for (let asset of assets) {
    let time = MIN_TIME.getTime();
    let procedure = 0;

    let nextTime = (p) => time  + (p ? Math.round(p[1] * (Math.random() * 1.8 + 0.8)) : randIntN(10) + 20) * 60 * 1000;
    time = nextTime();
    
    let dataSplines = new SplineHolder();
    dataCommandSplines.push([asset, dataSplines]);

    while (time < MAX_TIME) {
        let iso = new Date(time).toISOString();
        if (procedure == 0) {
            batchCommands.push(`series d:${iso} e:${asset.id} x:axi.Unit_BatchID="${batchid++}"`)
        } else if (procedures[procedure][0] === "Inactive") {
            batchCommands.push(`series d:${iso} e:${asset.id} x:axi.Unit_BatchID="Inactive"`)
        }
        statusCommands.push(`series d:${iso} e:${asset.id} x:axi.Unit_Procedure="${procedures[procedure][0]}"`)
        next_time = nextTime(procedures[procedure]);
        for (let [metric, splines] of metrics) {
            dataSplines.putSpline(time, next_time, metric, splines[procedures[procedure][0]]);
        }

        procedure = (procedure + 1) % procedures.length;
        time = next_time;
    }

}


console.log(batchCommands.join("\n"));
console.log(statusCommands.join("\n"));

let dataCommands = [""];
for (let [asset, splines] of dataCommandSplines) {
    let time = MIN_TIME.getTime();

    let nextTime = () => time  + (randIntN(4) + 60) * 1000;
    time = nextTime();

    while (time < MAX_TIME) {
        let iso = new Date(time).toISOString();
        for (let [metric,] of metrics) {
            let spline = splines.getSpline(metric, time);
            if (spline) {
                let value = spline(time);
                value *= (1 + .01 * Math.random());
                dataCommands.push(`series d:${iso} e:${asset.id} m:${metric}=${value.toFixed(2)}`);
            }
        }
        time = nextTime();
    }

}
console.log(dataCommands.join("\n"));

function randIntN(n) {
    n = n || 65535;
    return Math.floor(Math.random() * n);
}

/*
sv6.elapsed_time
==============================================================

Timestamp	            Value	Metric	            Entity
2016-10-04 01:52:05	    0	    sv6.elapsed_time	br-1470
2016-10-04 02:00:31	    506	    sv6.elapsed_time	br-1470
2016-10-04 02:00:34	    0	    sv6.elapsed_time	br-1470
2016-10-04 02:01:21	    47	    sv6.elapsed_time	br-1470
2016-10-04 02:01:25	    0	    sv6.elapsed_time	br-1470
2016-10-04 02:02:21	    56	    sv6.elapsed_time	br-1470
2016-10-04 02:04:14	    169	    sv6.elapsed_time	br-1470
2016-10-04 02:05:01	    216	    sv6.elapsed_time	br-1470
2016-10-04 02:09:05	    4.6E+2	sv6.elapsed_time	br-1470
2016-10-04 02:09:09	    0	    sv6.elapsed_time	br-1470
2016-10-04 02:10:00	    51	    sv6.elapsed_time	br-1470


sv6.unit_batchid
===============================================================

Timestamp	           Text	    Metric	            Entity
2016-10-04 01:52:05	   1413	    sv6.unit_batchid	br-1470
2016-10-04 02:00:34	   Inactive	sv6.unit_batchid	br-1470
2016-10-04 02:01:25	   1414	    sv6.unit_batchid	br-1470
2016-10-04 02:09:05	   Inactive	sv6.unit_batchid	br-1470
2016-10-04 02:09:09	   1415	    sv6.unit_batchid	br-1470


sv6.unit_procedure
===============================================================

Timestamp	            Text	    Metric	            Entity
2016-10-04 01:57:08     1413-Proc3	sv6.unit_procedure	br-1470
2016-10-04 02:00:34     Inactive	sv6.unit_procedure	br-1470
2016-10-04 02:01:25     1414-Proc1	sv6.unit_procedure	br-1470
2016-10-04 02:04:15     1414-Proc2	sv6.unit_procedure	br-1470
2016-10-04 02:07:52     1414-Proc3	sv6.unit_procedure	br-1470
2016-10-04 02:09:05     Inactive	sv6.unit_procedure	br-1470
2016-10-04 02:09:09     1415-Proc1	sv6.unit_procedure	br-1470
*/

/*

#define PREFIX sv6.

series e:<ASSET_ID> x:<PREFIX>unit_procedure=(Inactive|<BATCH_ID>-<PROCEDURE_ID>);




*/