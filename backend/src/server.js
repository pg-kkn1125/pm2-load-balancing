// Cluster Message Sender
const ClusterMessageSender = require("./models/ClusterMessageSender");
const uws = require("uWebSockets.js");
const { dev } = require("./models/DevConsole");
const { servers } = require("./utils/variables");
const { convertResponseData } = require("./utils/tools");
const cms = ClusterMessageSender.init("receive");
const bhp = require("./models/BackupHelper");
const helper = bhp.init();
let isDisableKeepAlive = false;
const sockets = new Map();
const players = new Map();
const viewers = new Map();
let deviceID = 0;
let newArray = [];

// cms.listen("main");
cms.listen("server");

const wsOptions = {
  // properties
  idleTimeout: 32,
  maxBackpressure: 1024,
  maxPayloadLength: 1024, // 패킷 데이터 용량 (용량이 넘을 시 서버 끊김)
  compression: uws.DEDICATED_COMPRESSOR_3KB,

  // method
  open(ws) {
    if (isDisableKeepAlive) {
      ws.close();
    }
    deviceID++;
    sockets.set(ws, deviceID);
    ws.subscribe(String(deviceID));
    ws.subscribe("server");
    console.log(deviceID);
    ws.send("socket server loaded!");
  },
  message(ws, message, isBinary) {
    const data = convertResponseData(message, isBinary);
    // const json = JSON.parse(data);
    dev.log(data);
    // dev.log(json);
    players.delete(sockets.get(data.id));
    cms.accessor.hasThread(data.thread);
    cms.accessor.send(data.thread, data, callback(ws));
    helper.backup.save(players, viewers);
    messageHandler(message, data, ws, isBinary);
  },
  drain(ws) {
    dev.log("WebSocket backpressure: ", ws.getBufferedAmount());
  },
  close(ws, code, message) {
    if (isDisableKeepAlive) {
      ws.unsubscribe(String(procId));
    }

    if (viewers.has(sockets.get(ws))) viewers.delete(sockets.get(ws));

    if (players.has(sockets.get(ws))) {
      players.delete(sockets.get(ws));
      app.publish("server", JSON.stringify(Object.fromEntries(players)));
    }

    console.log(sockets.get(ws) + " exited!");
    sockets.delete(ws);
    console.log(
      "current connect players: " +
        players.size +
        " \ncurrent connect viewers: " +
        viewers.size +
        " \n배열길이" +
        newArray.length
    );
  },
};

/**
 * 전체 서버에서 데이터 받을 수 있음
 */
const receiveServer = uws
  .App({})
  .ws("/uws/*", wsOptions)
  .any("/*", (res, req) => {
    res.writeHeader("Connection", true).writeStatus(200).end("test");
  })
  .listen(3000, (socket) => {
    if (socket) {
      process.send("ready");
      dev.log(`server listening on ws://localhost:${3000}/uws/*`);
    }
  });

function callback(ws) {
  return (result) => {
    receiveServer.publish(
      String(players.get(sockets.get(ws))),
      JSON.stringify(result.data)
    );
  };
}

function messageHandler(message, messageObject, ws, isBinary) {
  if (messageObject.device === "mobile") {
    receiveServer.publish("server", JSON.stringify(messageObject));
  }
  if (messageObject.type === "viewer") {
    viewers.set(
      sockets.get(ws),
      Object.assign(messageObject, { deviceID: sockets.get(ws) })
    );

    receiveServer.publish(
      String(sockets.get(ws)),
      JSON.stringify(new Array(viewers.get(sockets.get(ws))))
    );
    if (players.size > 0) deviceID++;
    ws.subscribe(String(deviceID));
    ws.subscribe("server");
    sockets.set(ws, deviceID);
    receiveServer.publish(
      "server",
      JSON.stringify(Object.fromEntries(players))
    );
  } else if (messageObject.type === "player") {
    players.set(
      sockets.get(ws),
      Object.assign(messageObject, { deviceID: sockets.get(ws) })
    );
    viewers.delete(sockets.get(ws));
    ws.unsubscribe(String(sockets.get(ws)));

    receiveServer.publish(
      "server",
      JSON.stringify(Object.fromEntries(players))
    );
  } else if (messageObject.type === "chat") {
    chatQueue.enter(message);
  } else if (messageObject.type === 4) {
    stateQueue.enter(message);
    Object.assign(players.get(messageObject.deviceID), messageObject);
  }
}

// 클라이언트 요청을 socket message로 받아
// sendMessage로 보내면 아래 메세지 이벤트로 받음
process.on("message", (packet) => {
  cms.alert("server", packet);

  receiveServer.publish(
    players.get("uWS.WebSocket {}") || "main",
    JSON.stringify(packet)
  );
});

// process dead
process.on("SIGINT", function () {
  isDisableKeepAlive = true;
  receiveServer.close(function () {
    process.exit(0);
  });
});

module.exports = receiveServer;

// setInterval(() => {
helper.backup.healthCheck();
// }, 1000);

// setInterval(() => {
//   helper.backup.check();
// }, 1000);
