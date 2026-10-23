const crypto = require('crypto');

// Timestamp + random suffix so IDs stay unique even when created in the same millisecond
const uniqueId = (prefix) => `${prefix}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

module.exports = { uniqueId };
