import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export const fields = ['revenue', 'operating_pnl', 'operating_cash_flow', 'total_debt', 'total_assets'];
const validDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

// Diagnostic only: this intentionally does not normalize or certify provider data.
export function assessQuarterly(raw, { mode, expectedDate } = {}) {
  if (!['synthetic', 'live', 'snapshot'].includes(mode)) throw new Error('Explicit data mode required');
  if (!validDate(expectedDate)) throw new Error('A valid exact expected date is required');
  const report = {
    mode, expected_date: expectedDate,
    payload_hash: createHash('sha256').update(raw).digest('hex'),
    live_gate_complete: false,
    issues: [], rows: [],
    pending_review: ['flow_basis', 'units', 'currency', 'publication_time', 'taxonomy', 'account_quota', 'cohort_coverage'],
  };
  let payload;
  try { payload = JSON.parse(raw); } catch { report.issues.push('invalid_json'); return report; }
  if (!Array.isArray(payload)) { report.issues.push('expected_array'); return report; }
  if (payload.length !== 1) report.issues.push('expected_one_exact_quarter');
  payload.forEach((row, index) => {
    const result = { source_pointer: `/${index}`, issues: [], fields: {} };
    report.rows.push(result);
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      result.issues.push('expected_record'); return;
    }
    if (row.date !== expectedDate) result.issues.push('period_mismatch');
    for (const field of fields) {
      const value = row[field];
      let status;
      if (!Object.hasOwn(row, field)) status = 'missing';
      else if (value === null) status = 'null';
      else if (typeof value === 'number') {
        // JSON.parse may round monetary tokens. Only safe integers are inspectable;
        // production normalization must use a lossless decimal JSON parser.
        status = Number.isSafeInteger(value) ? 'present_safe_integer' : 'requires_lossless_parser';
      } else if (typeof value === 'string' && /^-?(0|[1-9]\d*)(\.\d+)?$/.test(value)) {
        status = 'present_decimal_string';
      } else status = 'invalid_type';
      result.fields[field] = { source_pointer: `/${index}/${field}`, status };
    }
  });
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [file, mode, expectedDate, ...extra] = process.argv.slice(2);
  try {
    if (!file || extra.length) throw new Error('Usage: node scripts/assess-quarterly.mjs FILE MODE YYYY-MM-DD');
    const report = assessQuarterly(await readFile(file), { mode, expectedDate });
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    const unusable = report.issues.length || report.rows.some(row => row.issues.length
      || Object.values(row.fields).some(field => !field.status.startsWith('present_')));
    process.exitCode = unusable ? 2 : 0;
  } catch {
    process.stderr.write('Assessment failed. Check file access, explicit mode, and exact date.\n');
    process.exitCode = 1;
  }
}
