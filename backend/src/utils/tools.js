const pm2 = require("pm2");
const { workers, getWorkers } = require("./variables");

const convertResponseData = (data, isBinary) => {
  if (isBinary) {
    const decoder = new TextDecoder();
    const decodedText = decoder.decode(data);
    const parsedData = decodedText
      .split(",")
      .map((bi) => String.fromCharCode(parseInt(Number(bi), 2)))
      .join("");
    return JSON.parse(parsedData);
  }
  return data;
};

const startReceiveMessage = (name) => {
  pm2.launchBus(function (err, pm2_bus) {
    pm2_bus.on("process:msg", function (packet) {
      console.log(packet.hasOwnProperty("data") ? packet.data.from : "started");
      console.log(`${name}에서 받은 패킷 데이터 << `, packet);
    });
  });
};

module.exports = {
  convertResponseData,
  startReceiveMessage,
};
