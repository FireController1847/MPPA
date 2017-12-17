module.exports = class Chat {
  constructor(client) {
    this.client = client;

    this.isOpen = false;
  }

  send(msg) {
    this.client.sendArray([{m: "a", message: msg}]);
  }

  clear() {
    $("#chat > ul").empty();
  }

  recieve(msg, animate = true) {
    const el = $(`<li><div id="author" style="background-color: `
    + `${msg.p.color || "#c11e1e"}">${msg.p.name}</div>`
    + `<div id="content">${msg.a}</div></li>`);
    if (animate) {
      el.hide().css("opacity", 0).appendTo("#chat > ul").slideDown(10, 'easeInOutQuad');
      el.animate({opacity: 1}, 10);
    } else {
      el.appendTo("#chat > ul");
    }

    this.check();
    if (!this.isOpen) this.hide();

    // var eles = $("#chat ul li").get();
    // for(var i = 1; i <= 50 && i <= eles.length; i++) {
    //   eles[eles.length - i].style.opacity = 1.0 - (i * 0.03);
    // }
  }

  scrollToBottom() {
    const el = $("#chat > ul").get(0);
    el.scrollTop = el.scrollHeight;
  }
  
  check() {
    const msgs = $("#chat > ul > li").get();
    if (msgs.length > 256) {
      $(msgs[0]).remove();
    }
  }

  hide() {
    const msgs = $("#chat > ul > li").get();
    for (let i = 1; i <= 50 && i <= msgs.length; i++) {
      $(msgs[msgs.length - i]).css("opacity", 1.0 - (i * 0.0375));
    }
    if (msgs.length > 50) {
      msgs[0].style.display = "none";
    }
  }

  focus() {
    $("#chat > ul").addClass("focus");
    const msgs = $("#chat > ul > li").get();
    for (let i = 1; i <= 50 && i <= msgs.length; i++) {
      $(msgs[msgs.length - i]).css("opacity", "");
    }
    $("#chat > ul > li").css("display", "");
    this.scrollToBottom();
    this.isOpen = true;
  }

  unfocus() {
    $("#chat > ul").removeClass("focus");
    this.hide();
    this.isOpen = false;
  }
};