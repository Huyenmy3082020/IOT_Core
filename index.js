const path = require("path");
const iotClient = require("../src/iotClient");
const ruleEngine = require("./ruleEngine");
const metadataManager = require("./metadataManager");

const devices = [
  {
    device_id: "thing_demo",
    device_type: "sensor",
    certPrefix:
      "7157a8e90f99d80b367c470751ea5f396ad487fcf2209a98d5edfd3a97a1f424",
  },
  {
    device_id: "fan_A",
    device_type: "actuator",
    certPrefix: "your_fan_cert_prefix_here",
  },
];

const IOT_ENDPOINT =
  process.env.AWS_IOT_ENDPOINT ||
  "a276gezfq34zhl-ats.iot.ap-southeast-1.amazonaws.com";

const CERTS_BASE_DIR = path.join(__dirname, "certs");

async function main() {
  try {
    await iotClient.connect(devices, IOT_ENDPOINT, CERTS_BASE_DIR);

    iotClient.onStatusMessage((deviceId, payload) => {
      console.log(`🔔 Message from device ${deviceId}:`, payload);
      metadataManager.updateDeviceLastSeen(deviceId);
      const rule = ruleEngine.checkRule(deviceId, payload);
      if (rule) {
        console.log(`⚙️ Rule matched for device ${deviceId}:`, rule);
        iotClient.publishAutomationRule(deviceId, rule);
      }
    });
  } catch (err) {
    console.error("❌ Error in main:", err);
  }
}

main();
