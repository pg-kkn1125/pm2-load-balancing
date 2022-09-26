import Socket, { encodeData } from "./tools/Socket.js";

const socketInit = new Socket("server", 3000);
socketInit.setupSocket();
const socket = socketInit.server;

const type = ["viewer", "player"];
const thread = [
  "loc01",
  "loc02",
  "loc03",
  "loc04",
  "loc05",
  "loc06",
  "loc07",
  "loc08",
  "loc09",
  "chat",
];

setTimeout(() => {
  for (let i = 0; i < 10; i++) {
    const typeIndx = parseInt(Math.random() * type.length);
    const threadIdx = parseInt(Math.random() * thread.length);
    socket.send(
      encodeData({
        type: type[typeIndx], // 타겟 스레드
        // pass: "chat", // 전달 타겟 스레드
        thread: thread[threadIdx], // 타입
      })
    );
  }
}, 500);
