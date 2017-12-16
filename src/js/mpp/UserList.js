module.exports = class Chat {
  constructor(client) {
    this.client = client;
  }

  clear() {
    $("#users > ul").empty();
  }

  destroy(msg) {

  }

  recieve(p, animate = true) {
    const el = $(`<li style="background-color: ${p.color}">${p.name}</li>`);
    if (!animate) return el.appendTo("#users > ul");
    el.css("opacity", 0);
    el.appendTo("#users > ul");
    el.animate({"opacity": 1}, 500);
  }
};