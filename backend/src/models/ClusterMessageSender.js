const IndexedMap = require("../utils/IndexedMap");
const pm2 = require("pm2");
const { dev } = require("./DevConsole");

const ClusterMessageSender = (function () {
  function Controller() {
    let model = null;

    this.init = (_model) => {
      model = _model;
    };

    this.hasThread = (data) => model.hasThread(data);
    this.hasPass = (data) => model.hasThread(data);
    this.hasReturn = (data) => model.hasReturn(data);

    this.send = (key, packet, callback) => model.send(key, packet, callback);

    this.replyToReceive = (packet) => model.replyToReceive(packet);

    this.returnOrPassOver = (data) => model.returnOrPassOver(data);

    this.sendToClient = (socket) => model.sendToClient(socket);
  }

  function Model() {
    let sender = null;

    this.init = (_sender) => {
      sender = _sender;
    };

    this.hasThread = (packet) => {
      const has = packet.hasOwnProperty("thread");
      return has;
    };
    this.hasPass = (packet) => {
      const has = packet.hasOwnProperty("pass");
      return has;
    };
    this.hasReturn = (packet) => {
      const has = packet.hasOwnProperty("return");
      return has;
    };

    this.send = (key, packet, callback) => {
      dev.log(`[CMS] ${key}에게 메세지를 송신 합니다.`);
      sender.send(key, packet, callback);
    };

    this.replyToReceive = (data) => {
      sender.send("server", data);
    };

    this.returnOrPassOver = (data) => {
      if (this.hasPass(data) && !this.hasReturn(data)) {
        dev.log(`[CMS] ${data.pass}에게 메세지를 전달 합니다.`);
        sender.send(data.return ? "server" : data.pass, {
          ...data,
          return: true,
        });
      } else {
        dev.log(`[CMS] Server로 회신 합니다.`);
        sender.replyToReceive(data);
      }
    };

    this.sendToClient = (socket) => sender.sendToClient(socket);
  }

  function Sender() {
    // 채널 (클러스터)
    let channels = null;

    this.init = (_channels) => {
      channels = _channels;
    };

    this.sendToClient = (socket) => (result) => {
      socket.publish(result.data.thread, JSON.stringify(result.data));
    };

    // send 핵심 메서드
    this.send = (key, packet, callback) => {
      pm2.list((err, list) => {
        if (err) {
          // console.log(err)
        }
        list.forEach((item, idx) => {
          channels.set(item.name, item);
        });
        const processData = {
          type: "process:msg",
          data: packet,
          topic: true,
        };
        const hasChannel = Boolean(channels.get(key));
        const noConnection = {
          type: "process:msg",
          data: {
            thread: key,
            message: "연결된 스레드가 없습니다.",
          },
          topic: true,
        };

        pm2.sendDataToProcessId(
          hasChannel ? channels.get(key).pm_id : 0,
          hasChannel ? processData : noConnection,
          (err, result) => {
            if (err) {
              // dev.log("err", result);
              pm2.restart(
                channels.get(key).pm_id,
                {
                  updateEnv: true,
                },
                (e) => {}
              );
            }
            if (callback) {
              dev.log(`${key} 소켓에 packet을 보냅니다.`);
              callback(result);
            }
          }
        );
      });
    };

    // send 재사용한 회신 메서드
    this.replyToReceive = (data) => {
      this.send("server", data);
    };

    this.alert = (owner, packet) => {
      dev.log(
        `[CMS : PROCESS ${owner}] ${packet.data.thread}에게 메세지를 수신 받았습니다.`
      );
    };
  }

  return {
    init(name) {
      const controller = new Controller();
      const model = new Model();
      const sender = new Sender();
      const channels = new IndexedMap();

      pm2.list((err, list) => {
        list.forEach((item, idx) => {
          channels.set(item.name, item);
        });

        handleInitialize();
      });

      const handleInitialize = () => {
        controller.init(model);
        model.init(sender);
        sender.init(channels);
      };

      return {
        channels,
        accessor: controller,
        listen: this.listenMessage,
        alert: sender.alert,
      };
    },
    listenMessage(name) {
      pm2.launchBus(function (err, pm2_bus) {
        pm2_bus.on("process:msg", function (packet) {
          const hasData = packet.hasOwnProperty("data");
          // dev.log(hasData ? packet.data.thread : "started");
          dev.log(
            `${name} bus: ${
              hasData ? packet.data.thread : packet.process.name
            }에게 메세지를 수신 받았습니다.\n    내용 : `,
            packet
          );
        });
      });
    },
  };
})();

module.exports = ClusterMessageSender;
