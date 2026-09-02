#include <Wire.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <time.h>

// =====================================================
// FORWARD DECLARATIONS
// =====================================================

void showMessage(String line1, String line2, String line3);
void showMode();
void checkRFID();
void processJoystick();
void processJoystickSelect();
void processButtons();
void handleSOS();
void sendText();
void updateBeep();
void updateTempMessage();
void logoutUser();

// =====================================================
// WIFI + WEBHOOK
// =====================================================

const char* WIFI_SSID     = "glove";
const char* WIFI_PASSWORD = "12345678";

const char* WEBHOOK_URL =
  "https://speaklink.app.n8n.cloud/webhook-test/21c4a8be-1deb-4657-a546-9f484a61acf9";

// IST = UTC + 5:30
const long GMT_OFFSET_SEC = 5 * 3600 + 1800;
const int DAYLIGHT_OFFSET_SEC = 0;
const char* NTP_SERVER = "pool.ntp.org";

bool wifiReady = false;

// =====================================================
// OLED
// =====================================================

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define OLED_ADDR 0x3C

#define OLED_SDA 21
#define OLED_SCL 22

Adafruit_SSD1306 display(
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  &Wire,
  OLED_RESET
);

// =====================================================
// RFID RC522
// =====================================================

#define RFID_SS   5
#define RFID_RST  4
#define RFID_SCK  18
#define RFID_MISO 19
#define RFID_MOSI 23

MFRC522 rfid(
  RFID_SS,
  RFID_RST
);

// =====================================================
// JOYSTICK
// =====================================================

#define JOY_X 34
#define JOY_Y 35
#define JOY_SW 32

// =====================================================
// BUTTONS
// =====================================================

#define BTN1 13
#define BTN2 14
#define BTN3 26
#define BTN4 33
#define BTN5 27

int buttonPins[5] = {
  BTN1,
  BTN2,
  BTN3,
  BTN4,
  BTN5
};

// =====================================================
// BUZZER
// =====================================================

#define BUZZER 25

// =====================================================
// SYSTEM MODES
// =====================================================

enum Mode {
  LETTER_MODE,
  PHRASE_MODE,
  SOS_MODE,
  EXIT_MODE
};

Mode currentMode = LETTER_MODE;

// =====================================================
// SYSTEM STATE
// =====================================================

bool authenticated = false;
bool sosActive = false;

String typedText = "";

// =====================================================
// CURRENT RFID USER
// =====================================================
//
// RFID is stored here after successful authentication.
// It is NOT sent to webhook immediately.
//

String currentRFID = "";

// =====================================================
// BUTTON MULTI-PRESS
// =====================================================

bool buttonState[5] = {
  HIGH,
  HIGH,
  HIGH,
  HIGH,
  HIGH
};

bool lastRawState[5] = {
  HIGH,
  HIGH,
  HIGH,
  HIGH,
  HIGH
};

unsigned long lastDebounceTime[5] = {
  0,
  0,
  0,
  0,
  0
};

const unsigned long DEBOUNCE_DELAY = 25;

unsigned long lastPress[5] = {
  0,
  0,
  0,
  0,
  0
};

int pressCount[5] = {
  0,
  0,
  0,
  0,
  0
};

const unsigned long PRESS_TIMEOUT = 800;

// =====================================================
// JOYSTICK
// =====================================================

unsigned long lastJoystickMove = 0;

const unsigned long JOYSTICK_DELAY = 300;

const int JOY_CENTER_X = 1920;
const int JOY_DEADZONE = 600;

const int JOY_LOW =
  JOY_CENTER_X - JOY_DEADZONE;

const int JOY_HIGH =
  JOY_CENTER_X + JOY_DEADZONE;

// =====================================================
// SOS
// =====================================================

unsigned long lastSOSBeep = 0;

bool buzzerState = false;

// =====================================================
// NON-BLOCKING BEEP
// =====================================================

bool buzzerActive = false;

unsigned long buzzerOffAt = 0;

// =====================================================
// TEMPORARY MESSAGE
// =====================================================

bool tempMessageActive = false;

unsigned long tempMessageUntil = 0;

// =====================================================
// AUTHORIZED USERS
// =====================================================

struct AuthorizedUser {
  String uid;
  String name;
};

AuthorizedUser authorizedUsers[] = {
  { "3A 3D BF 62", "Vasan" },
  { "DA E2 AF 62", "Sai" }
};

const int NUM_USERS = sizeof(authorizedUsers) / sizeof(authorizedUsers[0]);

String currentUserName = "";

// =====================================================
// RFID FEEDBACK
// =====================================================

bool rfidFeedbackActive = false;

unsigned long rfidFeedbackUntil = 0;

// =====================================================
// PHRASES — VASAN
// =====================================================

String phrasesVasan[5][6] = {

  {
    "Hello, I'm Vasan",
    "Thank you",
    "Yes",
    "No",
    "Please",
    "Sorry"
  },

  {
    "I need water",
    "I need food",
    "I am hungry",
    "I am thirsty",
    "I am tired",
    "I need rest"
  },

  {
    "I need medicine",
    "I feel sick",
    "I need medical help",
    "I am in pain",
    "Call a doctor",
    "I need help"
  },

  {
    "Help me",
    "I am in danger",
    "Call the police",
    "Call an ambulance",
    "Please help",
    "I am lost"
  },

  {
    "Call Vasan's family",
    "I want to go home",
    "Please wait",
    "Where are you?",
    "Thank you",
    "Goodbye"
  }

};

// =====================================================
// PHRASES — SAI
// =====================================================

String phrasesSai[5][6] = {

  {
    "Hello, I'm Sai",
    "Thank you",
    "Yes",
    "No",
    "Please",
    "Sorry"
  },

  {
    "I need water",
    "I need food",
    "I am hungry",
    "I am thirsty",
    "I am tired",
    "I need rest"
  },

  {
    "I need medicine",
    "I feel sick",
    "I need medical help",
    "I am in pain",
    "Call a doctor",
    "I need help"
  },

  {
    "Help me",
    "I am in danger",
    "Call the police",
    "Call an ambulance",
    "Please help",
    "I am lost"
  },

  {
    "Call Sai's family",
    "I want to go home",
    "Please wait",
    "Where are you?",
    "Thank you",
    "Goodbye"
  }

};

// =====================================================
// GET CURRENT USER PHRASE
// =====================================================

String getPhrase(int button, int count) {

  if (button < 0 || button >= 5 || count < 1 || count > 6) {
    return "";
  }

  if (currentUserName == "Sai") {
    return phrasesSai[button][count - 1];
  }

  return phrasesVasan[button][count - 1];
}

// =====================================================
// WIFI CONNECTION
// =====================================================

void connectWiFi() {

  showMessage(
    "WIFI",
    "Connecting...",
    WIFI_SSID
  );

  WiFi.mode(WIFI_STA);

  WiFi.begin(
    WIFI_SSID,
    WIFI_PASSWORD
  );

  unsigned long start =
    millis();

  while (
    WiFi.status() != WL_CONNECTED &&
    millis() - start < 15000
  ) {

    delay(300);
  }

  if (
    WiFi.status() == WL_CONNECTED
  ) {

    wifiReady = true;

    Serial.println(
      "WIFI:CONNECTED " +
      WiFi.localIP().toString()
    );

    configTime(
      GMT_OFFSET_SEC,
      DAYLIGHT_OFFSET_SEC,
      NTP_SERVER
    );

    showMessage(
      "WIFI",
      "Connected!",
      WiFi.localIP().toString()
    );

    delay(800);

  }

  else {

    wifiReady = false;

    Serial.println(
      "WIFI:FAILED"
    );

    showMessage(
      "WIFI",
      "Not connected",
      "Working offline"
    );

    delay(800);
  }
}

// =====================================================
// TIMESTAMP
// =====================================================

String getTimestamp() {

  time_t now;

  time(&now);

  if (
    now < 1700000000
  ) {

    return "uptime_ms:" +
           String(millis());
  }

  struct tm timeinfo;

  localtime_r(
    &now,
    &timeinfo
  );

  char buf[32];

  strftime(
    buf,
    sizeof(buf),
    "%Y-%m-%dT%H:%M:%S",
    &timeinfo
  );

  return String(buf);
}

// =====================================================
// JSON ESCAPE
// =====================================================

String jsonEscape(String s) {

  s.replace(
    "\\",
    "\\\\"
  );

  s.replace(
    "\"",
    "\\\""
  );

  return s;
}

// =====================================================
// SEND FINAL INPUT TO WEBHOOK
// =====================================================
//
// RFID SCAN DOES NOT CALL THIS.
//
// This can be called MANY times during one authenticated
// session (multiple letters, phrases, or SOS toggles) —
// the session only ends when the user selects EXIT mode
// and presses the joystick to log out.
//
// JSON:
//
// {
//   "event":"INPUT_SENT",
//   "rfid_uid":"3A 3D BF 62",
//   "user_name":"Vasan",
//   "mode":"PHRASE",
//   "input":"I need water",
//   "timestamp":"..."
// }
//
// =====================================================

void sendInputToWebhook(
  String input
) {

  Serial.println(
    "================================"
  );

  Serial.println(
    "SENDING INPUT TO WEBHOOK"
  );

  Serial.println(
    "RFID UID: " +
    currentRFID
  );

  String modeString;

  if (
    currentMode == LETTER_MODE
  ) {

    modeString = "LETTER";

  }

  else if (
    currentMode == PHRASE_MODE
  ) {

    modeString = "PHRASE";

  }

  else {

    modeString = "SOS";
  }

  Serial.println(
    "MODE: " +
    modeString
  );

  Serial.println(
    "INPUT: " +
    input
  );

  // ---------------------------------------------------
  // WIFI CHECK
  // ---------------------------------------------------

  if (
    !wifiReady ||
    WiFi.status() != WL_CONNECTED
  ) {

    Serial.println(
      "WEBHOOK: SKIPPED - NO WIFI"
    );

    Serial.println(
      "================================"
    );

    return;
  }

  // ---------------------------------------------------
  // HTTP
  // ---------------------------------------------------

  HTTPClient http;

  http.begin(
    WEBHOOK_URL
  );

  http.addHeader(
    "Content-Type",
    "application/json"
  );

  http.setTimeout(5000);

  // ---------------------------------------------------
  // JSON PAYLOAD
  // ---------------------------------------------------

  String payload =
    "{"
    "\"event\":\"INPUT_SENT\","
    "\"rfid_uid\":\"" +
    jsonEscape(currentRFID) +
    "\","
    "\"user_name\":\"" +
    jsonEscape(currentUserName) +
    "\","
    "\"mode\":\"" +
    jsonEscape(modeString) +
    "\","
    "\"input\":\"" +
    jsonEscape(input) +
    "\","
    "\"timestamp\":\"" +
    getTimestamp() +
    "\""
    "}";

  Serial.println(
    "WEBHOOK PAYLOAD:"
  );

  Serial.println(
    payload
  );

  // ---------------------------------------------------
  // SEND POST
  // ---------------------------------------------------

  int httpCode =
    http.POST(payload);

  Serial.println(
    "WEBHOOK HTTP CODE: " +
    String(httpCode)
  );

  if (
    httpCode > 0
  ) {

    String response =
      http.getString();

    Serial.println(
      "WEBHOOK RESPONSE:"
    );

    Serial.println(
      response
    );

  }

  else {

    Serial.println(
      "WEBHOOK ERROR:"
    );

    Serial.println(
      http.errorToString(
        httpCode
      )
    );
  }

  http.end();

  Serial.println(
    "================================"
  );
}

// =====================================================
// SEND LOGOUT EVENT TO WEBHOOK
// =====================================================

void sendLogoutToWebhook() {

  if (
    !wifiReady ||
    WiFi.status() != WL_CONNECTED
  ) {

    Serial.println(
      "WEBHOOK: LOGOUT SKIPPED - NO WIFI"
    );

    return;
  }

  HTTPClient http;

  http.begin(
    WEBHOOK_URL
  );

  http.addHeader(
    "Content-Type",
    "application/json"
  );

  http.setTimeout(5000);

  String payload =
    "{"
    "\"event\":\"USER_LOGOUT\","
    "\"rfid_uid\":\"" +
    jsonEscape(currentRFID) +
    "\","
    "\"user_name\":\"" +
    jsonEscape(currentUserName) +
    "\","
    "\"timestamp\":\"" +
    getTimestamp() +
    "\""
    "}";

  Serial.println(
    "WEBHOOK LOGOUT PAYLOAD:"
  );

  Serial.println(
    payload
  );

  int httpCode =
    http.POST(payload);

  Serial.println(
    "WEBHOOK LOGOUT HTTP CODE: " +
    String(httpCode)
  );

  http.end();
}

// =====================================================
// BEEP
// =====================================================

void beep(
  int duration = 1000
) {

  digitalWrite(
    BUZZER,
    HIGH
  );

  buzzerActive = true;

  buzzerOffAt =
    millis() + duration;
}

// =====================================================
// UPDATE BEEP
// =====================================================

void updateBeep() {

  if (
    buzzerActive &&
    millis() >= buzzerOffAt
  ) {

    digitalWrite(
      BUZZER,
      LOW
    );

    buzzerActive = false;
  }
}

// =====================================================
// OLED MESSAGE  (uniform, content-aware sizing)
// =====================================================

void showMessage(
  String line1,
  String line2,
  String line3
) {

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  // ---------------------------------------------------
  // HEADER — always small & uniform
  // ---------------------------------------------------

  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println(line1);

  display.drawFastHLine(0, 10, SCREEN_WIDTH, SSD1306_WHITE);

  // ---------------------------------------------------
  // MAIN CONTENT — big (size 2), allowed to wrap onto
  // 2 lines. Only drops to small text if it's too long
  // to fit even across 2 wrapped lines.
  // ---------------------------------------------------

  const int size2CharsPerLine = 10;   // 128px / 12px per char
  const int size1CharsPerLine = 21;   // 128px / 6px per char

  int contentSize;
  int contentLines;

  if (line2.length() <= size2CharsPerLine * 2) {
    contentSize  = 2;
    contentLines = (line2.length() + size2CharsPerLine - 1) / size2CharsPerLine;
    if (contentLines < 1) contentLines = 1;
  } else {
    contentSize  = 1;
    contentLines = (line2.length() + size1CharsPerLine - 1) / size1CharsPerLine;
    if (contentLines < 1) contentLines = 1;
  }

  display.setTextSize(contentSize);
  display.setCursor(0, 16);
  display.println(line2);

  // ---------------------------------------------------
  // FOOTER — always small & uniform, pushed down to
  // clear however many lines the content actually used
  // ---------------------------------------------------

  int lineHeight  = (contentSize == 2) ? 16 : 8;
  int footerY     = 16 + (contentLines * lineHeight) + 2;

  if (footerY > SCREEN_HEIGHT - 8) {
    footerY = SCREEN_HEIGHT - 8;   // clamp so it never runs off-screen
  }

  display.setTextSize(1);
  display.setCursor(0, footerY);
  display.println(line3);

  display.display();
}

// =====================================================
// SHOW MODE
// =====================================================

void showMode() {

  display.clearDisplay();

  // Normal OLED text - no filled box / no inverted text
  display.setTextColor(SSD1306_WHITE);

  // ---------------------------------------------------
  // TITLE
  // ---------------------------------------------------

  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("SMARTASSIST");

  // ---------------------------------------------------
  // MODE
  // ---------------------------------------------------

  display.setTextSize(2);
  display.setCursor(0, 20);

  if (currentMode == LETTER_MODE) {
    display.println("LETTER");
  }

  else if (currentMode == PHRASE_MODE) {
    display.println("PHRASE");
  }

  else if (currentMode == SOS_MODE) {
    display.println("SOS");
  }

  else {
    display.println("EXIT");
  }

  // ---------------------------------------------------
  // FOOTER
  // ---------------------------------------------------

  display.setTextSize(1);
  display.setCursor(0, 50);

  if (currentMode == EXIT_MODE) {
    display.println("Joystick: Logout");
  }

  else if (currentMode == LETTER_MODE) {
    display.println("Joystick: Send");
  }

  else {
    display.println("Joystick: Select");
  }

  display.display();
}

// =====================================================
// GET RFID UID
// =====================================================

String getUID() {

  String uid = "";

  for (
    byte i = 0;
    i < rfid.uid.size;
    i++
  ) {

    if (
      rfid.uid.uidByte[i] < 0x10
    ) {

      uid += "0";
    }

    uid += String(
      rfid.uid.uidByte[i],
      HEX
    );

    if (
      i < rfid.uid.size - 1
    ) {

      uid += " ";
    }
  }

  uid.toUpperCase();

  return uid;
}

// =====================================================
// RFID AUTHENTICATION
// =====================================================
//
// IMPORTANT:
//
// RFID scan ONLY authenticates the user.
//
// NO WEBHOOK IS SENT HERE.
//
// =====================================================

void checkRFID() {

  // ---------------------------------------------------
  // Feedback screen
  // ---------------------------------------------------

  if (
    rfidFeedbackActive
  ) {

    if (
      millis() >=
      rfidFeedbackUntil
    ) {

      rfidFeedbackActive =
        false;

      if (
        authenticated
      ) {

        showMode();

      }

      else {

        showMessage(
          "READY",
          "SmartAssist Glove",
          "Scan RFID..."
        );
      }
    }

    return;
  }

  // ---------------------------------------------------
  // New card?
  // ---------------------------------------------------

  if (
    !rfid.PICC_IsNewCardPresent()
  ) {

    return;
  }

  if (
    !rfid.PICC_ReadCardSerial()
  ) {

    return;
  }

  // ---------------------------------------------------
  // Read UID
  // ---------------------------------------------------

  String uid =
    getUID();

  Serial.println(
    "RFID SCANNED: " +
    uid
  );

  // ---------------------------------------------------
  // CHECK AGAINST AUTHORIZED USER LIST
  // ---------------------------------------------------

  int matchIndex = -1;

  for (int i = 0; i < NUM_USERS; i++) {
    if (uid == authorizedUsers[i].uid) {
      matchIndex = i;
      break;
    }
  }

  // ---------------------------------------------------
  // AUTHORIZED
  // ---------------------------------------------------

  if (matchIndex != -1) {

    currentRFID =
      uid;

    currentUserName =
      authorizedUsers[matchIndex].name;

    authenticated =
      true;

    // Reset mode
    currentMode =
      LETTER_MODE;

    typedText =
      "";

    sosActive =
      false;

    Serial.println(
      "AUTH: OK"
    );

    Serial.println(
      "CURRENT RFID: " +
      currentRFID
    );

    Serial.println(
      "CURRENT USER: " +
      currentUserName
    );

    showMessage(
      "GRANTED",
      "Hi " + currentUserName,
      "Choose mode"
    );

    beep();

    // IMPORTANT:
    // NO WEBHOOK HERE

    rfidFeedbackActive =
      true;

    rfidFeedbackUntil =
      millis() + 1500;
  }

  // ---------------------------------------------------
  // DENIED
  // ---------------------------------------------------

  else {

    Serial.println(
      "AUTH: DENIED"
    );

    showMessage(
      "DENIED",
      "Unknown RFID card",
      "Try again"
    );

    beep();

    // IMPORTANT:
    // NO WEBHOOK HERE

    rfidFeedbackActive =
      true;

    rfidFeedbackUntil =
      millis() + 1500;
  }

  rfid.PICC_HaltA();

  rfid.PCD_StopCrypto1();
}

// =====================================================
// LOGOUT — ends the session, returns to RFID scan
// =====================================================

void logoutUser() {

  Serial.println(
    "LOGOUT: " +
    currentUserName
  );

  showMessage(
    "LOGGED OUT",
    "Bye " + currentUserName,
    "Scan RFID..."
  );

  beep();

  // Let n8n know this user's session ended
  sendLogoutToWebhook();

  authenticated      = false;
  sosActive          = false;
  typedText          = "";
  currentRFID        = "";
  currentUserName    = "";
  currentMode        = LETTER_MODE;
  rfidFeedbackActive = false;

  digitalWrite(BUZZER, LOW);
  buzzerActive = false;

  delay(1200);

  showMessage(
    "READY",
    "SmartAssist Glove",
    "Scan RFID..."
  );
}

// =====================================================
// LETTER MAPPING
// =====================================================

char getLetter(
  int button,
  int count
) {

  const char letters[4][6] = {

    {
      'A',
      'B',
      'C',
      'D',
      'E',
      'F'
    },

    {
      'G',
      'H',
      'I',
      'J',
      'K',
      'L'
    },

    {
      'M',
      'N',
      'O',
      'P',
      'Q',
      'R'
    },

    {
      'S',
      'T',
      'U',
      'V',
      'W',
      'X'
    }

  };

  if (
    button >= 0 &&
    button < 4 &&
    count >= 1 &&
    count <= 6
  ) {

    return letters[
      button
    ][
      count - 1
    ];
  }

  return 0;
}

// =====================================================
// PROCESS LETTER
// =====================================================
//
// Button 5:
//   1 press  = SPACE
//   2 presses = BACKSPACE
//
// Sending typed text is now done via the JOYSTICK
// BUTTON (see processJoystickSelect), not a 3rd press
// here.
//
// =====================================================

void processLetter(
  int button,
  int count
) {

  // ---------------------------------------------------
  // BUTTON 5
  // ---------------------------------------------------

  if (
    button == 4
  ) {

    // One press = SPACE
    if (
      count == 1
    ) {

      typedText += " ";
    }

    // Two presses = BACKSPACE
    else if (
      count == 2
    ) {

      if (
        typedText.length() > 0
      ) {

        typedText.remove(
          typedText.length() - 1
        );
      }
    }

    return;
  }

  // ---------------------------------------------------
  // LETTER
  // ---------------------------------------------------

  char letter =
    getLetter(
      button,
      count
    );

  if (
    letter != 0
  ) {

    typedText +=
      letter;
  }
}

// =====================================================
// PROCESS PHRASE
// =====================================================

void processPhrase(
  int button,
  int count
) {

  if (
    button >= 0 &&
    button < 5 &&
    count >= 1 &&
    count <= 6
  ) {

    typedText =
      getPhrase(button, count);

    // Phrase is complete.
    // Send it now.
    sendText();
  }
}

// =====================================================
// SEND TEXT
// =====================================================

void sendText() {

  if (
    typedText.length() == 0
  ) {

    return;
  }

  Serial.println(
    "FINAL INPUT: " +
    typedText
  );

  showMessage(
    "SENT",
    typedText,
    "Sending..."
  );

  beep();

  // ---------------------------------------------------
  // SEND RFID + MODE + INPUT
  // ---------------------------------------------------

  sendInputToWebhook(
    typedText
  );

  tempMessageActive =
    true;

  tempMessageUntil =
    millis() + 1000;
}

// =====================================================
// UPDATE TEMP MESSAGE
// =====================================================

void updateTempMessage() {

  if (
    tempMessageActive &&
    millis() >= tempMessageUntil
  ) {

    tempMessageActive =
      false;

    typedText =
      "";

    showMode();
  }
}

// =====================================================
// DISPLAY TYPED TEXT
// =====================================================

void displayTypedText() {

  display.clearDisplay();

  display.setTextColor(
    SSD1306_WHITE
  );

  display.setTextSize(1);

  display.setCursor(
    0,
    0
  );

  if (
    currentMode == LETTER_MODE
  ) {

    display.println(
      "LETTER MODE"
    );

  }

  else {

    display.println(
      "PHRASE MODE"
    );
  }

  display.setTextSize(2);

  display.setCursor(
    0,
    18
  );

  display.println(
    typedText
  );

  display.display();
}

// =====================================================
// BUTTON PROCESSING
// =====================================================

void processButtons() {

  if (
    tempMessageActive
  ) {

    return;
  }

  for (
    int i = 0;
    i < 5;
    i++
  ) {

    bool raw =
      digitalRead(
        buttonPins[i]
      );

    // -------------------------------------------------
    // DEBOUNCE
    // -------------------------------------------------

    if (
      raw !=
      lastRawState[i]
    ) {

      lastDebounceTime[i] =
        millis();

      lastRawState[i] =
        raw;
    }

    if (
      millis() -
      lastDebounceTime[i]
      >
      DEBOUNCE_DELAY
    ) {

      if (
        raw !=
        buttonState[i]
      ) {

        buttonState[i] =
          raw;

        // Falling edge
        if (
          buttonState[i] ==
          LOW
        ) {

          pressCount[i]++;

          lastPress[i] =
            millis();

          beep();
        }
      }
    }

    // -------------------------------------------------
    // MULTI-PRESS TIMEOUT
    // -------------------------------------------------

    if (
      pressCount[i] > 0 &&
      millis() -
      lastPress[i]
      >
      PRESS_TIMEOUT
    ) {

      if (
        currentMode ==
        LETTER_MODE
      ) {

        processLetter(
          i,
          pressCount[i]
        );

        displayTypedText();
      }

      else if (
        currentMode ==
        PHRASE_MODE
      ) {

        processPhrase(
          i,
          pressCount[i]
        );
      }

      pressCount[i] =
        0;
    }
  }
}

// =====================================================
// JOYSTICK MODE CONTROL
// =====================================================

void processJoystick() {

  int x =
    analogRead(
      JOY_X
    );

  if (
    millis() -
    lastJoystickMove
    <
    JOYSTICK_DELAY
  ) {

    return;
  }

  // ---------------------------------------------------
  // MOVE LEFT — previous mode
  // ---------------------------------------------------

  if (
    x < JOY_LOW
  ) {

    switch (currentMode) {

      case LETTER_MODE:
        currentMode = EXIT_MODE;
        break;

      case PHRASE_MODE:
        currentMode = LETTER_MODE;
        break;

      case SOS_MODE:
        currentMode = PHRASE_MODE;
        break;

      case EXIT_MODE:
        currentMode = SOS_MODE;
        break;
    }

    showMode();

    lastJoystickMove =
      millis();
  }

  // ---------------------------------------------------
  // MOVE RIGHT — next mode
  // ---------------------------------------------------

  else if (
    x > JOY_HIGH
  ) {

    switch (currentMode) {

      case LETTER_MODE:
        currentMode = PHRASE_MODE;
        break;

      case PHRASE_MODE:
        currentMode = SOS_MODE;
        break;

      case SOS_MODE:
        currentMode = EXIT_MODE;
        break;

      case EXIT_MODE:
        currentMode = LETTER_MODE;
        break;
    }

    showMode();

    lastJoystickMove =
      millis();
  }
}

// =====================================================
// JOYSTICK SELECT
// =====================================================
//
// LETTER_MODE : press = SEND typed text
// PHRASE_MODE : press = clear/reset screen
//               (phrases already auto-send on selection)
// SOS_MODE    : press = toggle SOS on/off
// EXIT_MODE   : press = LOGOUT (end session)
//
// =====================================================

void processJoystickSelect() {

  static bool lastState =
    HIGH;

  static bool stableState =
    HIGH;

  static unsigned long lastChange =
    0;

  bool raw =
    digitalRead(
      JOY_SW
    );

  if (
    raw != lastState
  ) {

    lastChange =
      millis();

    lastState =
      raw;
  }

  if (
    millis() -
    lastChange
    >
    40 &&
    raw != stableState
  ) {

    stableState =
      raw;

    // -------------------------------------------------
    // JOYSTICK PRESSED
    // -------------------------------------------------

    if (
      stableState ==
      LOW
    ) {

      // =================================================
      // SOS MODE
      // =================================================

      if (
        currentMode ==
        SOS_MODE
      ) {

        sosActive =
          !sosActive;

        // -----------------------------------------------
        // SOS ON
        // -----------------------------------------------

        if (
          sosActive
        ) {

          Serial.println(
            "SOS: ON"
          );

          typedText =
            "SOS ACTIVE";

          showMessage(
            "SOS!",
            "Emergency activated",
            "Sending..."
          );

          // ---------------------------------------------
          // SEND SOS
          // ---------------------------------------------

          sendInputToWebhook(
            "SOS ACTIVE"
          );
        }

        // -----------------------------------------------
        // SOS OFF
        // -----------------------------------------------

        else {

          Serial.println(
            "SOS: OFF"
          );

          digitalWrite(
            BUZZER,
            LOW
          );

          buzzerActive =
            false;

          typedText =
            "";

          showMode();
        }

        beep(150);
      }

      // =================================================
      // LETTER MODE — joystick press = SEND
      // =================================================

      else if (
        currentMode ==
        LETTER_MODE
      ) {

        sendText();
      }

      // =================================================
      // EXIT MODE — joystick press = LOGOUT
      // =================================================

      else if (
        currentMode ==
        EXIT_MODE
      ) {

        logoutUser();
      }

      // =================================================
      // PHRASE MODE — joystick press = reset screen
      // (phrases already auto-send on selection)
      // =================================================

      else {

        typedText =
          "";

        showMode();

        beep();
      }
    }
  }
}

// =====================================================
// SOS HANDLER
// =====================================================

void handleSOS() {

  if (
    !sosActive
  ) {

    return;
  }

  if (
    millis() -
    lastSOSBeep
    >=
    300
  ) {

    lastSOSBeep =
      millis();

    buzzerState =
      !buzzerState;

    digitalWrite(
      BUZZER,
      buzzerState
    );
  }
}

// =====================================================
// SETUP
// =====================================================

void setup() {

  Serial.begin(
    115200
  );

  // ===================================================
  // OLED
  // ===================================================

  Wire.begin(
    OLED_SDA,
    OLED_SCL
  );

  if (
    !display.begin(
      SSD1306_SWITCHCAPVCC,
      OLED_ADDR
    )
  ) {

    while (1);
  }

  // ===================================================
  // BUZZER
  // ===================================================

  pinMode(
    BUZZER,
    OUTPUT
  );

  digitalWrite(
    BUZZER,
    LOW
  );

  // ===================================================
  // BUTTONS
  // ===================================================

  for (
    int i = 0;
    i < 5;
    i++
  ) {

    pinMode(
      buttonPins[i],
      INPUT_PULLUP
    );
  }

  // ===================================================
  // JOYSTICK
  // ===================================================

  pinMode(
    JOY_X,
    INPUT
  );

  pinMode(
    JOY_Y,
    INPUT
  );

  pinMode(
    JOY_SW,
    INPUT_PULLUP
  );

  // ===================================================
  // RFID
  // ===================================================

  SPI.begin(
    RFID_SCK,
    RFID_MISO,
    RFID_MOSI,
    RFID_SS
  );

  rfid.PCD_Init();

  // ===================================================
  // WIFI
  // ===================================================

  connectWiFi();

  // ===================================================
  // READY
  // ===================================================

  showMessage(
    "READY",
    "SmartAssist Glove",
    "Scan RFID..."
  );

  Serial.println(
    "SMARTASSIST READY"
  );
}

// =====================================================
// MAIN LOOP
// =====================================================

void loop() {

  // ---------------------------------------------------
  // Buzzer
  // ---------------------------------------------------

  updateBeep();

  // ---------------------------------------------------
  // Temporary message
  // ---------------------------------------------------

  updateTempMessage();

  // ---------------------------------------------------
  // WAIT FOR RFID
  // ---------------------------------------------------

  if (
    !authenticated
  ) {

    checkRFID();

    return;
  }

  // ---------------------------------------------------
  // RFID FEEDBACK
  // ---------------------------------------------------

  if (
    rfidFeedbackActive
  ) {

    checkRFID();

    return;
  }

  // ---------------------------------------------------
  // SOS
  // ---------------------------------------------------

  if (
    sosActive
  ) {

    handleSOS();

    processJoystickSelect();

    return;
  }

  // ---------------------------------------------------
  // NORMAL OPERATION
  // ---------------------------------------------------

  processJoystick();

  processJoystickSelect();

  processButtons();
}
