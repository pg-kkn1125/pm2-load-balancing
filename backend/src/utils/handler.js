const { convertResponseData } = require("./tools");

// // 메세지 핸들러
const handleMessage = ({ ws, message, isBinary }) => {
  console.log("message", message);
  const data = convertResponseData(message, isBinary);
  if (typeof data === "string") {
    const json = JSON.parse(data);
    ws.send(data);
  } else {
    ws.send(message);
  }
};

module.exports = { handleMessage };
