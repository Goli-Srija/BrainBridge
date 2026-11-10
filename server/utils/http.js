// Small helpers shared by all controllers.

// Throw new HttpError(400, 'message') anywhere in a controller -> JSON error response.
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Wrap async route handlers so thrown errors reach the error middleware.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// The browser sends the student's LOCAL date (YYYY-MM-DD) in the X-Local-Date header,
// so streaks and daily logs follow the student's own calendar, not the server's timezone.
function localDate(req) {
  const h = req.get('X-Local-Date');
  if (h && /^\d{4}-\d{2}-\d{2}$/.test(h)) {
    const d = new Date(h + 'T00:00:00Z');
    const diffDays = Math.abs(d - Date.now()) / 86400000;
    if (!isNaN(d) && diffDays < 2) return h; // reject dates far from "now"
  }
  return new Date().toISOString().slice(0, 10);
}

function requireFields(body, fields) {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === null || String(body[f]).trim() === '');
  if (missing.length) throw new HttpError(400, `Missing required field(s): ${missing.join(', ')}`);
}

const toInt = (v, def) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
};

module.exports = { HttpError, asyncHandler, localDate, requireFields, toInt };
