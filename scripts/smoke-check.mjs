const base = process.env.EMBERVEIL_SERVER_URL ?? 'http://localhost:4000';

async function check(path) {
  const res = await fetch(`${base}${path}`);
  const body = await res.json();
  return { status: res.status, body };
}

const health = await check('/health');
const diag = await check('/ops/diagnostics');

console.log('health', health.status, health.body);
console.log('diagnostics', diag.status, diag.body?.diagnostics?.database ?? 'n/a');

if (health.status !== 200) process.exit(1);
