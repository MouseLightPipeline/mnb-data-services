const stats = require("stats-lite")

const data = require("./export.json");

const downloads = data.values.map(v => {
    const ids = v[4].split(",").map(i => {
        i = i.trim();
        return i;
    });

    if (ids.length === 1) {
        const test = parseInt(ids[0].substring(2));
        if (isNaN(test) || test > 502) {
            return null;
        }
    }

    return {
        downloadedAt: new Date(v[0]),
        isSwc: v[2] === 0,
        idCount: ids.length,
        ids
    }
}).filter(s => s !== null);

const swcOnly = downloads.filter(d => d.isSwc);

const swcCount = swcOnly.length;
const jsonCount = downloads.length - swcCount;


console.log("\n\n");

console.log("== Number of Downloads ==");
console.log(`Total:  ${downloads.length}`);
console.log(`SWC count:  ${swcCount}`);
console.log(`JSON count: ${jsonCount}`);

const counts = downloads.map(d => d.idCount);

console.log("\n\n");

console.log("== Number of neurons requested with each download ==");
console.log(`Min: ${Math.min(...counts)}`);
console.log(`Max: ${Math.max(...counts)}`);
console.log(`Mean: ${stats.mean(counts).toFixed(1)}`);
console.log(`Median: ${stats.median(counts)}`);
console.log(`Histogram:`);
console.log(stats.histogram(counts, 10));

console.log("\n\n");

const values = new Map<string, number>();

downloads.map(d => {
    d.ids.map(id => {
        if (!values.has(id)) {
            values.set(id, 1);
        } else {
            values.set(id, values.get(id) + 1);
        }
    });
});

const mostOften = Array.from(values.keys()).reduce((c: any, k: string) => {
    if (c.most === null) {
        c.mostCount = values.get(k);
        c.most = k;
        return c;
    }
    if (values.get(k) > c.mostCount) {
        c.nextMostCount = c.mostCount;
        c.nextMost = c.most;
        c.mostCount = values.get(k);
        c.most = k;
        return c;
    }

    if (values.get(k) > c.nextMost) {
        c.nextMostCount = values.get(k);
        c.nextMost = k;
        return c;
    }
    return c;

}, {most: null, mostCount: 0, nextMost: null});

console.log("\n\n");

console.log("== Most requested neurons and how many times ==");
console.log(`Most: ${mostOften.most} (${mostOften.mostCount})`);
console.log(`Next most: ${mostOften.nextMost} (${mostOften.nextMostCount})`);

console.log("\n\n");

const totalNeurons = Array.from(values.values()).reduce((c, n) => {
    return c + n
}, 0);

console.log("== Total Neurons Requested/Received ==");
console.log(`Total: ${totalNeurons}`);

console.log("\n\n");

const dates = downloads.map(d => d.downloadedAt.valueOf());

console.log(stats.histogram(dates, 5));
