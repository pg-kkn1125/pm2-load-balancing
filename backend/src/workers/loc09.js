// Cluster Message Sender
const ClusterMessageSender = require("../models/ClusterMessageSender");
const threadName = "loc09";
const cms = ClusterMessageSender.init(threadName);

process.on("message", (packet) => {
  cms.alert(threadName, packet);
  cms.accessor.returnOrPassOver(packet.data);
});

process.send("ready");
