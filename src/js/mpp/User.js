const Client = require('./src/Client.js');

module.exports = class User extends Client {
  constructor(uri, proxy) {
    super(uri || 'ws://www.multiplayerpiano.com/', proxy);
  }

  switch(name, settings) {
    if (this.channel && this.channel._id === name) return this;
    this.setChannel(name || "lobby", settings);
  }
};