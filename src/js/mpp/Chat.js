module.exports = class Chat {
  constructor(client) {
    this.client = client;
  }

  send(msg) {
    this.client.sendArray([{m: "a", message: msg}]);
  }

  clear() {
    $("#chat > ul").empty();
  }

  recieve(msg) {
    const el = $(`<li><div id="author" style="background-color: `
    + `${msg.p.color || "#c11e1e"}">${msg.p.name}</div>`
    + `<div id="content">${msg.a}</div></li>`);
    el.hide().css("opacity", 0).appendTo("#chat > ul").slideDown(10, 'easeInOutQuad');
    el.animate({opacity: 1}, 10);

    this.check();

    // var eles = $("#chat ul li").get();
    // for(var i = 1; i <= 50 && i <= eles.length; i++) {
    //   eles[eles.length - i].style.opacity = 1.0 - (i * 0.03);
    // }
  }
  
  check() {
    const msgs = $("#chat > ul > li").get();
    for (let i = 1; i <= 50 && i <= msgs.length; i++) {
      $(msgs[msgs.length - i]).css("opacity", 1.0 - (i * 0.03));
    }
    if (msgs.length > 50) {
      msgs[0].style.display = "none";
    }
    if (msgs.length > 256) {
      $(msgs[0]).remove();
    }
  }
};