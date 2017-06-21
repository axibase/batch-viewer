function randInt(max) {
    max = Math.floor(max) || 0x7FFFFFFF;
    return Math.floor(Math.random() * max);
}

function randString(length) {
    length = Math.floor(length) || 16;
    let buffer = new ArrayBuffer(length);
    let result = new Uint8Array(buffer);
    for (let i = 0; i < length; i++) {
        result[i] = 0x41 + randInt(26);
    }
    return new Buffer(buffer).toString("ascii");
}

const UNIT_SIZE = 100;
const SITE_COUNT = 5;
const BUILDING_COUNT = 10;

const BATCH_LENGTH_BASIS = 3600000; /* 1 hour */
const BATCH_SPACE_BASIS  = 60000; /* 1 minute */
const START_DATE = Date.now() - BATCH_LENGTH_BASIS * 24 * 7;
const END_DATE = Date.now();

const fs = require("fs");
const units = fs.openSync("units.json", "w");
const batches = fs.openSync("batches.json", "w");
try {
    fs.writeSync(units, "[\n");
    fs.writeSync(batches, "[\n");
    for (let i = 1; i <= UNIT_SIZE; i++) {
        let nSite = randInt(SITE_COUNT);
        let site = `site-${nSite}`;
        let building = `building-${nSite}-${randInt(BUILDING_COUNT)}`;
        let unitId = `machine-${randString(10)}`;
        fs.writeSync(units, JSON.stringify({
            unitId,
            site,
            building,
        }));
        let start = START_DATE;
        while (start < END_DATE) {
            let startAt = start;
            let endAt = Math.min(startAt + BATCH_LENGTH_BASIS * randInt(100), END_DATE);
            start = endAt + BATCH_SPACE_BASIS * randInt(100);
            fs.writeSync(batches, JSON.stringify({
                unit: unitId,
                batchId: `batch-${randString(10)}`,
                startAt,
                endAt,
                procedures: [
                    {
                        name: "Procedure-1",
                        at: startAt,
                        to: startAt + (endAt - startAt) * 5 / 12,
                    },
                    {
                        name: "Procedure-2",
                        at: (startAt + endAt) / 2,
                        to: startAt + (endAt - startAt) * 3 / 4,
                    },
                    {
                        name: "Procedure-3",
                        at: startAt + (endAt - startAt) * 10 / 12,
                        to: endAt,
                    }
                ]
            }));
            fs.writeSync(batches, i === UNIT_SIZE && start >= END_DATE ? "\n" : ",\n");
        }
        fs.writeSync(units, i === UNIT_SIZE ? "\n" : ",\n");
    }
    fs.writeSync(units, "]\n");
    fs.writeSync(batches, "]\n");
} catch (e) {
    console.error(e)
} finally {
    fs.closeSync(units)
    fs.closeSync(batches)
    // output.close();
    // outputJSON.close();
}
