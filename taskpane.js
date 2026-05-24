/* taskpane.js — ESP32 WebSocket → Excel data logger */

let ws = null, logging = false, currentRow = 2;
const HEADERS = ["Time", "Temp (°C)", "Humidity (%)", "Light (raw)"];

Office.onReady(async ({ host }) => {
  if (host === Office.HostType.Excel) await writeHeaders();
  log("Office ready — enter ESP32 IP and click Connect.");
});

// ── WebSocket ─────────────────────────────────────────────
function connect() {
  const ip   = el("ip").value.trim();
  const port = el("port").value;
  if (!ip) return log("Enter the ESP32 IP address first.");

  const url = `ws://${ip}:${port}`;
  log(`Connecting → ${url} …`);
  ws = new WebSocket(url);

  ws.onopen = () => {
    setStatus("Connected to " + url, "ok");
    setBtns(true);
    log("WebSocket open.");
  };

  ws.onmessage = ({ data }) => {
    let d; try { d = JSON.parse(data); } catch { return; }
    if (d.tmp !== undefined) el("v-tmp").textContent = d.tmp.toFixed(1) + " °C";
    if (d.hum !== undefined) el("v-hum").textContent = d.hum.toFixed(1) + " %";
    if (d.lux !== undefined) el("v-lux").textContent = d.lux;
    if (logging) writeRow(d);
  };

  ws.onclose = () => reset("Disconnected.");
  ws.onerror = () => reset("Connection failed — check IP/port and WiFi network.");
}

function disconnect() { ws?.close(); }

function reset(msg) {
  setStatus(msg, "err"); setBtns(false); logging = false; ws = null; log(msg);
}

function setBtns(connected) {
  el("btn-con").disabled  =  connected;
  el("btn-dis").disabled  = !connected;
  el("btn-log").disabled  = !connected;
  el("btn-stop").disabled = true;
}

// ── Logging controls ──────────────────────────────────────
function startLog() {
  currentRow = +el("start-row").value || 2;
  logging    = true;
  el("btn-log").disabled  = true;
  el("btn-stop").disabled = false;
  log(`Logging started at row ${currentRow}.`);
}

function stopLog() {
  logging = false;
  el("btn-log").disabled  = false;
  el("btn-stop").disabled = true;
  log("Logging paused.");
}

// ── Excel operations ──────────────────────────────────────
async function writeHeaders() {
  await Excel.run(async ctx => {
    const r = ctx.workbook.worksheets.getActiveWorksheet().getRange("A1:D1");
    r.values           = [HEADERS];
    r.format.font.bold = true;
    r.format.fill.color = "#0078d4";
    r.format.font.color = "#ffffff";
    await ctx.sync();
  }).catch(e => log("Header error: " + e.message));
}

async function writeRow(d) {
  const max   = +el("max-rows").value  || 200;
  const start = +el("start-row").value || 2;
  if (currentRow > start + max - 1) currentRow = start;   // ring-buffer wrap

  const row = [new Date().toLocaleTimeString(), d.tmp ?? "", d.hum ?? "", d.lux ?? ""];

  await Excel.run(async ctx => {
    ctx.workbook.worksheets.getActiveWorksheet()
      .getRange(`A${currentRow}:D${currentRow}`).values = [row];
    await ctx.sync();
  }).catch(e => log("Write error: " + e.message));

  currentRow++;
}

async function clearSheet() {
  const start = +el("start-row").value || 2;
  await Excel.run(async ctx => {
    ctx.workbook.worksheets.getActiveWorksheet()
      .getRange(`A${start}:D2000`).clear("Contents");
    await ctx.sync();
  }).catch(e => log("Clear error: " + e.message));
  currentRow = start;
  log("Sheet cleared.");
}

// ── Helpers ───────────────────────────────────────────────
const el = id => document.getElementById(id);

function setStatus(msg, cls) {
  const s = el("status"); s.textContent = msg; s.className = cls;
}

function log(msg) {
  const s = el("log");
  s.textContent = `[${new Date().toLocaleTimeString()}] ${msg}\n` + s.textContent;
  if (s.textContent.length > 1200) s.textContent = s.textContent.slice(0, 1200);
}
