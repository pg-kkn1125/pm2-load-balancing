export const encodeData = (data) => {
  const jsonData = JSON.stringify(data);
  const binaryData = jsonData
    .split("")
    .map((json) => json.charCodeAt(0).toString(2));
  const encoder = new TextEncoder();
  return encoder.encode(binaryData);
};

class Socket {
  count = 0;
  connected = false;
  constructor(name, port) {
    this.socketname = name;
    this.port = port;
    this[name] = new WebSocket(`ws://localhost:${port}/uws/${name}`);
  }
  onopen = (e) => {
    if (this.count > 0) {
      console.log("[open] 재연결에 성공했습니다.");
    } else {
      console.log("[open]");
    }
    board.classList.add("active");
    this.connected = true;
  };
  onmessage = (e) => {
    if (e.data instanceof Blob) {
      const reader = new FileReader();
      reader.readAsBinaryString(e.data);
      reader.onload = () => {
        board.innerHTML = "서버에서 받은 메세지 : " + e.data;
      };
    } else {
      board.innerHTML = "서버에서 받은 메세지 : " + e.data;
    }
  };
  onclose = (e) => {
    console.log("[close]");
    this.connected = false;
    this.retry();
  };
  onerror = (e) => {
    console.log("error");
    this.connected = false;
    this.retry();
  };
  retry = (e) => {
    console.log(e);
    console.log("다시 연결을 시도합니다.");
    const data = {
      from: "server",
      signal: true,
    };
    const encodedBinaryData = encodeData(data);
    this["server"].send(encodedBinaryData);
    board.classList.remove("active");
    function retryConnect() {
      this[this.socketname] = new WebSocket(
        `ws://localhost:${this.port}/uws/${this.socketname}`
      );

      if (!this.connected && this.count < 10) {
        this.count++;
        console.log(`재 연결 시도 : ${this.count}`);
        setTimeout(() => this.retry.bind(this), 1000);
      }
    }
    retryConnect.bind(this);
  };
  setupSocket() {
    const name = this.socketname;
    this[name].onopen = this.onopen;
    this[name].onmessage = this.onmessage;
    this[name].onclose = this.onclose;
    this[name].onerror = this.onerror;
  }
}

export default Socket;
