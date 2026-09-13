import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { assessQuarterly } from '../../scripts/assess-quarterly.mjs';

const raw = await readFile(new URL('../fixtures/synthetic/quarterly-feasibility.json', import.meta.url));
const options = { mode: 'synthetic', expectedDate: '2026-03-31' };
const modified = (patch) => JSON.stringify([{ ...JSON.parse(raw)[0], ...patch }]);

test('synthetic inspection retains pointers without asserting live feasibility or basis', () => {
  const report = assessQuarterly(raw, options);
  assert.equal(report.mode, 'synthetic');
  assert.equal(report.live_gate_complete, false);
  assert.ok(report.pending_review.includes('flow_basis'));
  assert.equal(report.rows[0].fields.revenue.status, 'present_decimal_string');
  assert.equal(report.rows[0].fields.revenue.source_pointer, '/0/revenue');
  assert.equal(report.payload_hash, assessQuarterly(raw, options).payload_hash);
  assert.ok(!JSON.stringify(report).includes('10000000000000000.01'));
});
test('null and absent debt stay distinct; liabilities cannot substitute', () => {
  assert.equal(assessQuarterly(modified({ total_debt: null }), options).rows[0].fields.total_debt.status, 'null');
  assert.equal(assessQuarterly(modified({ total_debt: undefined, total_liabilities: 100 }), options).rows[0].fields.total_debt.status, 'missing');
});
test('unsafe integers and fractional JSON numbers require lossless parsing', () => {
  for (const revenue of [10000000000000000, 0.1]) {
    assert.equal(assessQuarterly(modified({ revenue }), options).rows[0].fields.revenue.status, 'requires_lossless_parser');
  }
});
test('wrong quarter, multiple quarters and invalid shape are rejected', () => {
  assert.deepEqual(assessQuarterly(modified({ date: '2025-12-31' }), options).rows[0].issues, ['period_mismatch']);
  for (const input of ['[]', '[{},{}]']) assert.ok(assessQuarterly(input, options).issues.includes('expected_one_exact_quarter'));
  assert.deepEqual(assessQuarterly('{}', options).issues, ['expected_array']);
  assert.deepEqual(assessQuarterly('bad secret payload', options).issues, ['invalid_json']);
  assert.deepEqual(assessQuarterly('[null]', options).rows[0].issues, ['expected_record']);
});
test('explicit mode and real calendar date are mandatory', () => {
  for (const mode of [undefined, 'auto']) assert.throws(() => assessQuarterly(raw, { ...options, mode }));
  for (const expectedDate of ['2026-02-30', 'yesterday', undefined]) assert.throws(() => assessQuarterly(raw, { ...options, expectedDate }));
});
test('unexpected types are flagged and payload changes alter the hash', () => {
  assert.equal(assessQuarterly(modified({ revenue: true }), options).rows[0].fields.revenue.status, 'invalid_type');
  assert.notEqual(assessQuarterly(modified({ revenue: 0 }), options).payload_hash, assessQuarterly(raw, options).payload_hash);
});
