function checkSheet(href, newHref) {
  for (const i in document.styleSheets) {
    if (isNaN(parseInt(i))) continue;
    const sheet = document.styleSheets[i];
    if (sheet.href == href) {
      const rules = sheet.rules || sheet.cssRules;
      if (rules.length == 0) {
        const nl = document.createElement('link'); // New Link
        nl.setAttribute('rel', 'stylesheet');
        nl.setAttribute('type', 'text/css');
        nl.setAttribute('href', newHref);
        document.getElementsByTagName('head')[0].appendChild(nl);
      }
    }
  }
}

checkSheet("https://unpkg.com/material-components-web@latest/dist/material-components-web.min.css", "../css/backup/material-components-web@0.26.0.min.css");
checkSheet("https://fonts.googleapis.com/icon?family=Material+Icons", "../css/backup/material_icons.css");