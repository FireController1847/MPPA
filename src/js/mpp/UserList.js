module.exports = class UserList {
  constructor(client) {
    this.client = client;
  }

  clear() {
    $("#users > ul").empty();
  }

  destroy(msg) {

  }

  recieve(p, animate = true) {
    const el = $(`<li style="background-color: ${p.color}" id="${p.id}">${p.name}</li>`);
    if (!animate) return el.appendTo("#users > ul");
    el.css("opacity", 0);
    el.appendTo("#users > ul");
    el.animate({"opacity": 1}, 500);

    this.sort();
  }

  remove(p) {
    const users = $("#users > ul");
    const user = $("#users > ul").find(`li[id="${p.id}"]`);
    if (!user) return;
    user.animate({"opacity": 0}, 500, () => {
      user.remove();
      this.sort();
    });
  }

  update(p) {
    const users = $("#users > ul");
    const user = $("#users > ul").find(`li[id="${p.id}"]`);
    if (!user) return;
    user.text(p.name);
    user.css("background-color", p.color);
  }

  sort() {
    const users = $("#users > ul");
    const arr = users.children().sort((a, b) => {
      const p1 = this.client.ppl[$(a).attr("id")];
      const p2 = this.client.ppl[$(b).attr("id")];
      if (!p1 || !p2) return 0;
      if (p1.name < p2.name) return -1;
      if (p1.name > p2.name) return 1;
      return 0;
    });
    users.html(arr);
  }
};