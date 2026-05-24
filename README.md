DOWNLOAD THE ESP32_Excel_Streamer.xml FROM ABOVE HERE

[The "Shared Folder" Solution (Best for Desktop)

This is the standard way to "sideload" an XML manifest in Desktop Excel without needing a local dev server.
    Create a local folder on your computer (e.g., C:\MyAddins).
    Download your manifest file (ESP32_Excel_Streamer.xml) and place it inside that C:\MyAddins folder.
    Share the folder:
        Right-click C:\MyAddins > Properties > Sharing tab.
        Click Share..., select your user account, and give it "Read" access.
        Copy the Network Path (it will look like \\YourComputerName\MyAddins).

   -  Tell Excel to look in that folder:
        Open Excel (Desktop).
        Go to File > Options > Trust Center > Trust Center Settings.
        Select Trusted Add-in Catalogs.
        In the "Catalog URL" box, paste the Network Path you copied in Step 3.
        Click Add Catalog.
        Check the box "Show in Menu" (if prompted) and click OK.
        Restart Excel.

    Enable the Add-in:
        Go to the Insert tab in Excel.
        Click the dropdown next to Get Add-ins (or "My Add-ins").
        You should now see a new tab labeled "SHARED FOLDER".
        Select your ESP32 Add-in from there.]

## 1. The ESP32 Firmware (`ESP32_Streamer.ino`)

HX711 Arduino Library
*Install **WebSockets** and **ArduinoJson** libraries in the Arduino IDE before uploading.*

Install Libraries: In Arduino IDE, go to Sketch > Include Library > Manage Libraries... and search for:
1. WebSockets (by Markus Sattler)
2. ArduinoJson (by Benoit Blanchon)
 Install both.

```cpp
#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include "HX711.h"

// --- CONFIGURATION ---
const char* SSID     = "YOUR_WIFI_SSID";
const char* PASSWORD = "YOUR_WIFI_PASSWORD";

// Load Cell Pins
const int LOADCELL_DOUT_PIN = 4;
const int LOADCELL_SCK_PIN = 5;

HX711 scale;
WebSocketsServer wsServer(81);

void setup() {
  Serial.begin(115200);
  delay(1000); // Give the Serial Monitor a second to wake up

  WiFi.begin(SSID, PASSWORD);
  Serial.println("\nConnecting to WiFi...");

  int timeout = 0;
  // This loop will run for 30 seconds
  while (WiFi.status() != WL_CONNECTED && timeout < 60) {
    delay(500);
    Serial.print(".");
    timeout++;
  }

  Serial.println(""); // New line

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("--- SUCCESS ---");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("--- FAILED ---");
    Serial.print("Status Code: ");
    Serial.println(WiFi.status()); // This number is the key!
    // 0: WL_IDLE_STATUS
    // 1: WL_NO_SSID_AVAIL
    // 3: WL_CONNECT_FAILED (usually wrong password)
    // 4: WL_CONNECTION_LOST
    // 6: WL_DISCONNECTED
  }
}

void loop() {
  wsServer.loop();
  static unsigned long lastSend = 0;
  
  if (millis() - lastSend >= 500) {
    lastSend = millis();
    
    // Read weight (units depend on your calibration)
    float weight = scale.get_units(5); 

    StaticJsonDocument<128> doc;
    doc["weight"] = weight; // Sending as 'weight'
    
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
