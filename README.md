DOWNLOAD THE ZIP FOLDER (esp32-excel.zip)FROM ABOVE HERE

## 1. The ESP32 Firmware (`ESP32_Streamer.ino`)

*Install **WebSockets** and **ArduinoJson** libraries in the Arduino IDE before uploading.*

Install Libraries: In Arduino IDE, go to Sketch > Include Library > Manage Libraries... and search for:
1. WebSockets (by Markus Sattler)
2. ArduinoJson (by Benoit Blanchon)
 Install both.

```cpp
#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include "DHT.h"

// --- CONFIGURATION ---
const char* SSID     = "YOUR_WIFI_SSID";
const char* PASSWORD = "YOUR_WIFI_PASSWORD";
#define DHTPIN 4     
#define DHTTYPE DHT22 

WebSocketsServer wsServer(81);
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();
  WiFi.begin(SSID, PASSWORD);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  
  wsServer.begin();
  Serial.println("\n--- CONNECTED ---");
  Serial.println("IP Address: " + WiFi.localIP().toString());
}

void loop() {
  wsServer.loop();
  static unsigned long lastSend = 0;
  
  if (millis() - lastSend >= 500) {
    lastSend = millis();
    float h = dht.readHumidity();
    float t = dht.readTemperature();

    StaticJsonDocument<128> doc;
    doc["tmp"] = isnan(t) ? 0 : round(t * 10) / 10.0;
    doc["hum"] = isnan(h) ? 0 : round(h * 10) / 10.0;
    
    String json;
    serializeJson(doc, json);
    wsServer.broadcastTXT(json);
  }
}

```

---


# ESP32 Data Streamer for Excel

Stream live sensor data from your ESP32 directly into Microsoft Excel wirelessly.

## Quick Start

1. **Download & Extract:** Download the ZIP file and extract it anywhere on your computer.
2. **Install Extension:** Open the folder and double-click `Install_ESP32_Extension.bat`. Wait for the "Setup Complete" message.
3. **Configure ESP32:** - Open your ESP32 code in Arduino IDE.
* Update `SSID` and `PASSWORD` to your Wi-Fi settings.
* Upload the code and note the **IP Address** shown in the Serial Monitor.


4. **Connect in Excel:**
* Open Excel.
* Go to the **Insert** tab > **Add-ins** > **ESP32 Data Streamer**.
* Enter your ESP32's IP address in the sidebar and click **Connect**.
* Click **Log** to start streaming data into your spreadsheet!



## Troubleshooting

* **Connection Failed:** Ensure your computer and your ESP32 are connected to the same Wi-Fi network.
* **Add-in Not Showing:** Ensure you ran the `Install_ESP32_Extension.bat` file.
* **IP Address:** You must check the Serial Monitor in Arduino IDE every time you power on your ESP32 to get its current IP address.

---

### Why this is the best setup for your students:

1. **"Smart" Installation:** The `.bat` file handles the complex Windows folder paths automatically.
2. **Live Updates:** The data is pushed via WebSockets every 500ms, creating a "live ticker" effect in Excel.
3. **Persistence:** By adding the `localStorage` logic to your `taskpane.js` (from our previous step), their Excel will remember their ESP32 IP address so they don't have to type it every time.

**You are all set!** Just zip the `.xml`, the `.bat`, and your `README.md` together, and you have a professional-grade classroom tool ready for download.
