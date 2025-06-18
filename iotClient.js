const awsIot = require("aws-iot-device-sdk");
const path = require("path");
const fs = require("fs");

let clientInstance = null;
let onStatusCallback = null;

function connect(devices, iotEndpoint, certsBaseDir) {
  if (!devices || devices.length === 0) {
    return Promise.reject(new Error("No devices provided"));
  }

  const certDir = path.join(certsBaseDir, devices[0].device_id);

  [
    "7157a8e90f99d80b367c470751ea5f396ad487fcf2209a98d5edfd3a97a1f424-private.pem.key",
    "7157a8e90f99d80b367c470751ea5f396ad487fcf2209a98d5edfd3a97a1f424-certificate.pem.crt",
    "AmazonRootCA1.pem",
  ].forEach((f) => {
    const fullPath = path.join(certDir, f);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Missing cert file: ${fullPath}`);
    }
  });

  clientInstance = awsIot.device({
    keyPath: path.join(
      certDir,
      "7157a8e90f99d80b367c470751ea5f396ad487fcf2209a98d5edfd3a97a1f424-private.pem.key"
    ),
    certPath: path.join(
      certDir,
      "7157a8e90f99d80b367c470751ea5f396ad487fcf2209a98d5edfd3a97a1f424-certificate.pem.crt"
    ),
    caPath: path.join(certDir, "AmazonRootCA1.pem"),
    clientId: "familia-cloud-" + Date.now(),
    host: iotEndpoint,
  });

  return new Promise((resolve, reject) => {
    clientInstance.on("connect", () => {
      console.log("✅ Connected to AWS IoT");

      devices.forEach((d) => {
        const topic = `haudi/fe1.0/YOUR_CUSTOMER_UUID/${d.device_type}/${d.device_id}/status`;
        console.log("📡 Subscribing to topic:", topic);
        clientInstance.subscribe(topic);
      });

      resolve();
    });

    clientInstance.on("error", (err) => {
      console.error("❌ AWS IoT error:", err);
      reject(err);
    });

    clientInstance.on("message", (topic, payload) => {
      const segments = topic.split("/");
      const deviceId = segments[4];
      if (onStatusCallback && deviceId) {
        try {
          const data = JSON.parse(payload.toString());
          onStatusCallback(deviceId, data);
        } catch (err) {
          console.error("❌ Failed to parse payload:", err);
        }
      }
    });
  });
}

function onStatusMessage(cb) {
  onStatusCallback = cb;
}

function publishAutomationRule(deviceId, rule) {
  if (!clientInstance) {
    console.error("❌ Client not connected");
    return;
  }
  const topic = `haudi/fe1.0/YOUR_CUSTOMER_UUID/sensor/${deviceId}/automation`;
  clientInstance.publish(topic, JSON.stringify(rule), { qos: 1 }, (err) => {
    if (err) console.error("❌ Publish error:", err);
    else console.log(`📤 Published automation rule to topic: ${topic}`);
  });
}

module.exports = {
  connect,
  onStatusMessage,
  publishAutomationRule,
};
