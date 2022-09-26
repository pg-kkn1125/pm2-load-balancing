const IndexedMap = require("./IndexedMap");

const isDev = process.env.NODE_ENV === "development";

/**
 * 서버
 */
const servers = [
  "receive",
  "loc01",
  "loc02",
  "loc03",
  "loc04",
  "loc05",
  "loc06",
  "loc07",
  "loc08",
  "loc09",
  "db",
  "chat",
];

var workers = new IndexedMap();

const getWorkers = (clusters) => {
  clusters.forEach((worker) => {
    workers.set(worker.name, worker);

    // worker.postMessage("test callback message");
  });

  return workers;
};

module.exports = { isDev, servers, workers, getWorkers };
