const http = require('http');
const options = { method: 'GET', host: '127.0.0.1', port: process.env.PORT ? Number(process.env.PORT) : 4000, path: '/_health', timeout: 3000 };
const req = http.request(options, (res) => {
  if (res.statusCode === 200) process.exit(0);
  else process.exit(1);
});
req.on('error', () => process.exit(1));
req.on('timeout', () => { req.destroy(); process.exit(1); });
req.end();
