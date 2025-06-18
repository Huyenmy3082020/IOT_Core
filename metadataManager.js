const fs = require("fs");
const path = require("path");

const devicesPath = path.join(__dirname, "..", "config", "devices.json");

function loadDevices() {
  return JSON.parse(fs.readFileSync(devicesPath, "utf-8"));
}

function updateDeviceLastSeen(deviceId) {
  const devices = loadDevices();
  const idx = devices.findIndex((d) => d.device_id === deviceId);
  if (idx !== -1) {
    devices[idx].last_seen = new Date().toISOString();
    fs.writeFileSync(devicesPath, JSON.stringify(devices, null, 2));
  }
}

module.exports = { loadDevices, updateDeviceLastSeen };
