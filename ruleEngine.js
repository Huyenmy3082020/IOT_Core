const rules = require("../config/automation_rules.json");

function checkRule(deviceId, payload) {
  if (!rules[deviceId]) return null;

  const { co2_threshold, actions } = rules[deviceId];

  if (payload.co2 && payload.co2 > co2_threshold) {
    return {
      rule_id: "auto_fan_on",
      description: "Bật quạt khi CO2 cao",
      version: Date.now().toString(),
      created_at: new Date().toISOString(),
      actions,
    };
  }
  return null;
}

module.exports = { checkRule };
