// Central error handler: converts thrown errors into consistent JSON responses.
module.exports = function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err.status) return res.status(err.status).json({ error: err.message, details: err.details });
  if (err.code === '23505') return res.status(409).json({ error: 'This record already exists.' });
  if (err.code === '23514' || err.code === '22P02') return res.status(400).json({ error: 'Invalid value submitted.' });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File is too large (max 5 MB).' });
  console.error('[error]', req.method, req.originalUrl, err);
  res.status(500).json({ error: 'Something went wrong on the server. Please try again.' });
};
