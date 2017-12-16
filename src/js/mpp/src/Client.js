const EventEmitter = require('events').EventEmitter;
const ProxyAgent = require('https-proxy-agent');
const WebSocket = require('ws');
const url = require('url');

module.exports = class MPPClient extends EventEmitter {
  constructor(uri, proxy) {
    super();
    this.proxy = proxy;
    this.uri = uri;
    this.ws = undefined;
    this.serverTimeOffset = 0;
    this.user = undefined;
    this.participantId = undefined;
    this.channel = undefined;
    this.ppl = {};
    this.connectionTime = undefined;
    this.connectionAttempts = 0;
    this.desiredChannelId = undefined;
    this.desiredChannelSettings = undefined;
    this.pingInterval = undefined;
    this.canConnect = false;
    this.noteBuffer = [];
    this.noteBufferTime = 0;
    this.noteFlushInterval = undefined;
    this.firstTimeConnect = true;

    this.bindEventListeners();

    this.emit("status", "(Offline mode)");

    this.offlineChannelSettings = {
      lobby: true,
      visible: false,
      chat: false,
      crownsolo: false,
      color:"#ecfaed"
    };


    this.offlineParticipant = {
      name: "",
      color: "#777"
    };
  }

  isSupported() {
    return typeof WebSocket === "function";
  }

  isConnected() {
    return this.isSupported() && this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  isConnecting() {
    return this.isSupported() && this.ws && this.ws.readyState === WebSocket.CONNECTING;
  }

  start() {
    this.canConnect = true;
    this.connect();
  }

  stop() {
    this.canConnect = false;
    this.ws.close();
  }

  connect() {
    if (!this.canConnect || !this.isSupported() || this.isConnected() || this.isConnecting()) 
      return;
    this.firstTimeConnect = true;
    this.emit("status", "Connecting...");
    this.ws = new WebSocket(this.uri, {
      headers: {"Origin": "http://www.multiplayerpiano.com"},
      agent: (this.proxy ? new ProxyAgent(url.parse(this.proxy)) : null)
    });
    this.ws.addEventListener("close", event => {
      this.user = undefined;
      this.participantId = undefined;
      this.channel = undefined;
      this.setParticipants([]);
      clearInterval(this.pingInterval);
      clearInterval(this.noteFlushInterval);

      this.emit("disconnect");
      this.emit("status", "Offline mode");

      // Connect
      if (this.connectionTime) {
        this.connectionTime = undefined;
        this.connectionAttempts = 0;
      } else {
        this.connectionAttempts++;
      }
      const ms_lut = [50, 2950, 7000, 10000];
      let idx = this.connectionAttempts;
      if (idx > ms_lut.length) idx = ms_lut.length - 1;
      const ms = ms_lut[idx];
      setTimeout(this.connect.bind(this), ms);
    });
    
    this.ws.addEventListener("error", err => {
      this.ws.emit("wserror", err);
      this.ws.emit("close");
    });

    this.ws.addEventListener("open", event => {
      this.connectionTime = Date.now();
      this.sendArray([{m: "hi"}]);
      this.pingInterval = setInterval(() => {
        this.sendArray([{m: "t", e: Date.now()}]);
      }, 20000);
      this.noteBuffer = [];
      this.noteBufferTime = 0;
      this.noteFlushInterval = setInterval(() => {
        if (this.noteBufferTime && this.noteBuffer.length > 0) {
          this.sendArray([{m: "n", t: this.noteBufferTime + this.serverTimeOffset, n: this.noteBuffer}]);
          this.noteBufferTime = 0;
          this.noteBuffer = [];
        }
      }, 200);
      this.emit("connect");
      this.emit("status", "Joining channel...");
    });

    this.ws.addEventListener("message", event => {
      const transmission = JSON.parse(event.data);
      for (let i = 0; i < transmission.length; i++) {
        const msg = transmission[i];
        this.emit(msg.m, msg);
      }
    });
  }

  bindEventListeners() {
    this.on("hi", msg => {
      this.user = msg.u;
      this.receiveServerTime(msg.t, msg.e || undefined);
      if (this.desiredChannelId) {
        this.setChannel();
      }
    });

    this.on("t", msg => {
      this.receiveServerTime(msg.t, msg.e || undefined);
    });

    this.on("ch", msg => {
      this.desiredChannelId = msg.ch._id;
      this.channel = msg.ch;
      if (msg.p) this.participantId = msg.p;
      this.setParticipants(msg.ppl);
    });

    this.on("p", msg => {
      this.participantUpdate(msg);
      this.emit("participant update", this.findParticipantById(msg.id));
    });

    this.on("m", msg => {
      if (this.ppl.hasOwnProperty(msg.id)) {
        this.participantUpdate(msg);
      }
    });

    this.on("bye", msg => {
      this.removeParticipant(msg.p);
    });
  }

  send(raw) {
    if (this.isConnected()) this.ws.send(raw);
  }

  sendArray(arr) {
    this.send(JSON.stringify(arr));
  }

  setChannel(id, set) {
    this.desiredChannelId = id || this.desiredChannelId || "lobby";
    this.desiredChannelSettings = set || this.desiredChannelSettings || undefined;
    if (this.isConnected()) this.ws.send(JSON.stringify([{m: "ch", _id: this.desiredChannelId, set: this.desiredChannelSettings}]), () => {
      if (this.firstTimeConnect) {
        this.firstTimeConnect = false;
        this.emit(`ready`);
      }
    });
    return this;
  }

  getChannelSetting(key) {
    if (!this.isConnected() || !this.channel || !this.channel.settings) {
      return this.offlineChannelSettings[key];
    }
    return this.channel.settings[key];
  }

  getOwnParticipant() {
    return this.findParticipantById(this.participantId);
  }

  setParticipants(ppl) {
    for (const id in this.ppl) {
      if (!this.ppl.hasOwnProperty(id)) continue;
      let found = false;
      for (let j = 0; j < ppl.length; j++) {
        if (ppl[j].id === id) {
          found = true;
          break;
        }
      }
      if (!found) {
        this.removeParticipant(id);
      }
    }
    for (let i = 0; i < ppl.length; i++) {
      this.participantUpdate(ppl[i]);
    }
  }

  countParticipants() {
    let count = 0;
    for (const i in this.ppl) {
      if (this.ppl.hasOwnProperty(i)) count++;
    }
    return count;
  }

  participantUpdate(update) {
    let part = this.ppl[update.id] || null;
    if (part === null) {
      part = update;
      this.ppl[part.id] = part;
      this.emit("participant added", part);
      this.emit("count", this.countParticipants());
    } else {
      if (update.x) part.x = update.x;
      if (update.y) part.y = update.y;
      if (update.color) part.color = update.color;
      if (update.name) part.name = update.name;
    }
  }

  removeParticipant(id) {
    if (this.ppl.hasOwnProperty(id)) {
      const part = this.ppl[id];
      delete this.ppl[id];
      this.emit("participant removed", part);
      this.emit("count", this.countParticipants());
    }
  }

  findParticipantById(id) {
    return this.ppl[id] || this.offlineParticipant;
  }

  isOwner() {
    return this.channel && this.channel.crown && this.channel.crown.participantId === this.participantId;
  }

  preventsPlaying() {
    return this.isConnected() && !this.isOwner() && this.getChannelSetting("crownsolo") === true;
  }

  receiveServerTime(time, echo) {
    const now = Date.now();
    const target = time - now;
    const duration = 1000;
    let step = 0;
    const steps = 50;
    const step_ms = duration / steps;
    const difference = target - this.serverTimeOffset;
    const inc = difference / steps;
    const iv = setInterval(() => {
      this.serverTimeOffset += inc;
      if (step++ >= steps) {
        clearInterval(iv);
        this.serverTimeOffset = target;
      }
    }, step_ms);
  }

  startNote(note, vel) {
    if (!this.isConnected()) return;
    vel = typeof vel === "undefined" ? undefined : +vel.toFixed(3);
    if (!this.noteBufferTime) {
      this.noteBufferTime = Date.now();
      this.noteBuffer.push({n: note, v: vel});
    } else {
      this.noteBuffer.push({d: Date.now() - this.noteBufferTime, n: note, v: vel});
    }
  }

  stopNote(note) {
    if (!(this.isConnected())) return;
    if (!this.noteBufferTime) {
      this.noteBufferTime = Date.now();
      this.noteBuffer.push({n: note, s: 1});
    } else {
      this.noteBuffer.push({d: Date.now() - this.noteBufferTime, n: note, s: 1});
    }
  }
};