const pm2 = require("pm2");
const IndexedMap = require("../utils/IndexedMap");
const { servers } = require("../utils/variables");
const { dev } = require("./DevConsole");

const backupDB = new Map();
const DB_LIMIT = 200;

const BackupHelper = (function BackupHelper() {
  function Controller() {
    let model = null;

    this.init = (_model) => {
      model = _model;
    };

    this.healthCheck = () => {
      model.healthCheck();
    };

    // 데이터 저장
    this.save = (player, viewer) => {
      model.save(player, viewer);
    };
    // 데이터 로드
    this.load = (server) => {
      model.load(server);
    };
    // 데이터 리셋
    this.reset = (server) => {
      model.reset(server);
    };
    // 데이터 확인
    this.check = () => model.check();
  }

  function Model() {
    let helper = null;

    this.init = (_helper) => {
      helper = _helper;
      // servers.forEach((server) => {
      backupDB.set("player", []);
      backupDB.set("viewer", []);
      // });
    };

    this.healthCheck = () => {
      helper.healthCheck();
    };

    // 데이터 저장
    this.save = (player, viewer) => {
      helper.save(player, viewer);
    };

    // 데이터 로드
    this.load = (server) => {
      helper.load(server);
    };

    // 데이터 리셋
    this.reset = (server) => {
      helper.clear(server);
    };
    // 데이터 확인
    this.check = () => helper.check();
  }

  function Helper() {
    let option = null;

    this.init = (_option) => {
      option = _option;
    };

    this.healthCheck = () => {
      // setInterval(() => {
      pm2.list((err, list) => {
        // list.on("exit", () => {
        let ok = true;
        ok = list.some((process) => {
          dev.log(process.pm2_env.status);
          return process.pm2_env.status === "online";
        });
        dev.log(
          `[Backup Helper] ${ok ? "모든 스레드 온라인" : "스레드 하나가 죽음"}`
        );
        // });
      });
      // }, 1000);
    };

    // 데이터 저장
    this.save = (player, viewer) => {
      if (this.isLimit("player")) {
        this.firstShift("player");
      }
      if (this.isLimit("viewer")) {
        this.firstShift("viewer");
      }
      const playerHistory = backupDB.get("player");
      const viewerHistory = backupDB.get("viewer");
      playerHistory.push(player);
      viewerHistory.push(viewer);
      backupDB.set("player", playerHistory);
      backupDB.set("viewer", viewerHistory);
      dev.log(`[Backup DB Log]`, backupDB);
    };

    this.isLimit = (name) => backupDB.get(name).length > DB_LIMIT;

    this.firstShift = (name) => {
      const history = backupDB.get(name);
      history.shift(); // 제거
      backupDB.set(name, history);
    };

    // 데이터 로드
    this.load = (name) => {
      this.check();
      return backupDB.get(name);
    };

    // 데이터 리셋
    this.reset = () => {
      backupDB.clear();
      this.check();
    };
    // 데이터 확인
    this.check = () =>
      dev.log(
        `[Backup DB Log]`,
        `\nplayer size:`,
        backupDB.get("player").length,
        `\nviewer size:`,
        backupDB.get("viewer").length
      );
  }
  return {
    init() {
      const helper = new Helper();
      const model = new Model();
      const controller = new Controller();

      controller.init(model);
      model.init(helper);
      helper.init();

      return {
        backup: controller,
      };
    },
  };
})();

module.exports = BackupHelper;
