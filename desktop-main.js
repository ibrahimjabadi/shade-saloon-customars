// Desktop shell for the SHADI SALOON customer app. Unlike the admin app's
// desktop-main.js (which just points a window at a live deployed URL),
// this app has no confirmed public deployment — so instead it boots its
// own bundled server.js in-process (same file `npm start` runs) to serve
// the built dist/ locally, then opens a window at that local address.
// Data still comes from the real network: server.js only serves static
// files, every actual API call from the page goes to the backend URL
// configured in public/config.js (copied into dist/ as-is at build time).
const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("path");
const http = require("http");

const PORT = process.env.PORT || 4310;
process.env.PORT = String(PORT);

function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function poll() {
      http
        .get(url, (res) => {
          res.resume();
          resolve();
        })
        .on("error", () => {
          if (Date.now() - start > timeoutMs) return reject(new Error("Local server did not start in time"));
          setTimeout(poll, 150);
        });
    })();
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 480,
    height: 860,
    minWidth: 380,
    minHeight: 640,
    title: "Shadi Saloon",
    icon: path.join(__dirname, "public", "assets", "icon-512.png"),
    backgroundColor: "#F6F6F3",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.loadURL(`http://127.0.0.1:${PORT}/`);
  return win;
}

function buildMenu() {
  const isMac = process.platform === "darwin";
  const template = [
    ...(isMac ? [{ role: "appMenu" }] : []),
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
      ],
    },
    { role: "quit" },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(async () => {
  // Starts listening as a side effect of require() — same file `npm start`
  // runs directly, no separate child process needed since Electron's main
  // process already runs full Node.
  require("./server.js");
  await waitForServer(`http://127.0.0.1:${PORT}/health`);

  buildMenu();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
