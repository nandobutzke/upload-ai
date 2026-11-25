const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'content-type': 'application/json',
  },
  body: JSON.stringify(body),
});

const readJsonBody = (event) => {
  if (!event || event.body == null || event.body === '') {
    return {};
  }

  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;

  return JSON.parse(raw);
};

module.exports = {
  json,
  readJsonBody,
};
