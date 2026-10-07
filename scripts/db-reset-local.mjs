import { execFileSync } from 'node:child_process';

const result = execFileSync('npx', ['supabase', 'status', '-o', 'env'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
if (!/API_URL="?http:\/\/127\.0\.0\.1:|API_URL="?http:\/\/localhost:/i.test(result)) {
  console.error('Refusing reset: Supabase status did not report a localhost API_URL.');
  process.exit(1);
}
execFileSync('npx', ['supabase', 'db', 'reset', '--local'], { stdio: 'inherit' });
