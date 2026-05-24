let ws = null, logging = false, currentRow = 2;
const HEADERS = ["Time", "Weight (g)"];

Office.onReady(async ({ host }) => {
  if (host === Office.HostType.Excel) await writeHeaders();
  log("Office ready — enter ESP32 IP/ngrok link and click Connect.");
});

function connect() {
  const ipInput = el("ip").value.trim();
  let url;

  // If you paste your ngrok link, format it automatically
  if (ipInput.includes("ngrok-free.dev")) {
    // Strip out http:// or https:// if present, then build the wss:// link
    const cleanDomain = ipInput.replace(/^https?:\/\//, "");
    url = `wss://${cleanDomain}`;
  } else {
    // Fallback to normal IP and Port logic
    const port = el("port").value;
    url = `ws://${ipInput}:${port}`;
  }

  log(`Attempting connection to: ${url}`);
  ws = new WebSocket(url);

  ws.onopen = () => {
    el("status").textContent = "Connected";
    setBtns(true);
    log("WebSocket open.");
  };

  ws.onmessage = ({ data }) => {
    let d; try { d = JSON.parse(data); } catch { return; }
    if (d.weight !== undefined) {
        el("v-weight").textContent = d.weight.toFixed(2) + " g";
    }
    if (logging) writeRow(d.weight);
  };

  ws.onclose = () => reset("Disconnected.");
  ws.onerror = () => reset("Connection Error.");
}

function disconnect() { ws?.close(); }

function reset(msg) {
  el("status").textContent = msg;
  setBtns(false); logging = false; ws = null; log(msg);
}

function setBtns(connected) {
  el("btn-con").disabled = connected;
  el("btn-dis").disabled = !connected;
  el("btn-log").disabled = !connected;
  el("btn-stop").disabled = true;
}

function startLog() {
  currentRow = +el("start-row").value || 2;
  logging = true;
  el("btn-log").disabled = true;
  el("btn-stop").disabled = false;
  log("Logging started.");
}

function stopLog() {
  logging = false;
  el("btn-log").disabled = false;
  el("btn-stop").disabled = true;
}

async function writeHeaders() {
  await Excel.run(async ctx => {
    const r = ctx.workbook.worksheets.getActiveWorksheet().getRange("A1:B1");
    r.values = [HEADERS];
    r.format.font.bold = true;
    await ctx.sync();
  });
}

async function writeRow(weight) {
  // Capture the row immediately to prevent rapid-stream overwriting
  const targetRow = currentRow;
  currentRow++; 
  
  const row = [new Date().toLocaleTimeString(), weight ?? 0];
  
  await Excel.run(async ctx => {
    ctx.workbook.worksheets.getActiveWorksheet()
      .getRange(`A${targetRow}:B${targetRow}`).values = [row];
    await ctx.sync();
  }).catch(e => log("Write error: " + e.message));
}

const el = id => document.getElementById(id);
function log(msg) {
  const s = el("log");
  s.textContent = `[${new Date().toLocaleTimeString()}] ${msg}\n` + s.textContent;
}
