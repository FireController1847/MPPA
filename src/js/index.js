window.onload = () => {
  const $ = require("jquery-easing");
  window.$ = $;

  // Create Client
  const client = new (require('../js/mpp/User.js'))();
  client.setChannel('lobby').start();

  // Chat
  const chat = new (require('../js/mpp/Chat.js'))(client);
  client.on('c', c => {
    chat.clear();
    for (let i = 0; i < c.c.length; i++) {
      chat.recieve(c.c[i], false);
    }
  });
  client.on('a', a => {
    if (chat.isOpen) {
      chat.recieve(a, false);
      return chat.scrollToBottom();
    }
    chat.recieve(a);
  });
  $("#chat > input").on("focus", () => {
    chat.focus();
  });
  $(document).on("mousedown", e => {
    if (!$("#chat").has(e.target).length > 0) {
      chat.unfocus();
    }
  });
  $(document).on("keydown", e => {
    if (e.which == 27 && chat.isOpen) {
      chat.unfocus();
    }
  });
  $(document).on("keypress", e => {
    if (e.which == 13 && chat.isOpen) {
      client.sendMessage($("#chat > input").val());
      $("#chat > input").val("");
      chat.unfocus();
      $("#chat > input").blur();
    } else if (e.which == 13) {
      chat.focus();
      $("#chat > input").focus();
    }
  });

  // UserList
  const ul = new (require('../js/mpp/UserList.js'))(client);
  client.on("participant added", p => {
    ul.recieve(p);
  });
  client.on("participant removed", p => {
    ul.remove(p);
  });
  client.on("participant update", p => {
    ul.update(p);
  });

  // Rooms
  const rlist = new (require("@material/drawer/dist/mdc.drawer"))["MDCPersistentDrawer"]($(".mdc-persistent-drawer")[0]);
  $("#menu").on("click", () => {
    rlist.open = !rlist.open;
    if (rlist.open)
      client.sendArray([{m: "+ls"}]);
    else
      client.sendArray([{m: "-ls"}]);
  });
  $("#roomlist").on("click", "> *", e => {
    client.switch($(e.target).attr("roomname"));
    // ul.clear();
    rlist.open = !rlist.open;
  });
  client.on('ls', ls => {
    if (ls.c) $("#roomlist").empty();
    for (const key in ls.u) {
      if (!ls.u.hasOwnProperty(key)) continue;
      const room = ls.u[key];
      let info = $(`#roomlist > li[roomname="${room._id}"]`);
      if (info.length == 0) {
        info = $(`<li class="mdc-list-item"><div>${room._id}</div><span class="mdc-list-item__start-detail">${room.count}</span></li>`);
        info.attr("roomname", room._id);
        $("#roomlist").append(info);
      }
      if (room.count == 0) info.remove();
      const rname = info.children().eq(0);
      const rcount = info.children().eq(1);
      rname.text(room._id);
      rcount.text(room.count);
      if (room.settings.lobby) {
        rcount.css("background-color", "transparent");
        rcount.css("color", "#808080");
        rcount.append($(`<i class="material-icons">start</li>`));
      }
      if (!room.settings.chat) info.attr("nochat", "");
      else info.removeAttr("nochat");
      if (!room.settings.visible) info.css("display", "none");
      else info.css("display", "");
      if (room.settings.crownsolo) info.attr("solo", "");
      else info.removeAttr("solo");
    }
  });

  // On Ready
  client.on('ready', () => {
    chat.recieve({'p': {
      color: '#6BA5E9',
      name: 'System'
    }, a: 'Connected.'});
  });

  window.MPPA = {
    "chat": chat,
    "client": client
  };

  // Quickfix for bug with chat
  setTimeout(() => { if (!chat.isOpen) chat.hide(); }, 2000);
};