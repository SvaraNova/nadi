"""Run isolated PostgreSQL integration tests. Requires psql and TEST_DATABASE_URL."""
import os
from pathlib import Path
import subprocess
import uuid
import threading

url = os.environ.get('TEST_DATABASE_URL')
if not url:
    raise SystemExit('TEST_DATABASE_URL must point to a dedicated test database')
schema = 'nadi_test_' + uuid.uuid4().hex
root = Path(__file__).resolve().parent.parent

def sql(query):
    result = subprocess.run(['psql', '-X', url, '-v', 'ON_ERROR_STOP=1', '-At', '-c',
                             f'SET search_path TO {schema}, public;\n' + query],
                            text=True, capture_output=True, timeout=30)
    if result.returncode:
        # SQL is synthetic; never emit the connection URL.
        raise RuntimeError(result.stderr)
    return result.stdout.strip().splitlines()[-1:]

try:
    sql(f'CREATE SCHEMA {schema}')
    for migration in sorted((root / 'db/migrations').glob('*.sql')):
        sql(migration.read_text())
    sql((root / 'tests/database/durable-jobs.sql').read_text())
    print('PASS: deduplication, conflicts, recovery, stale lease rollback, cancellation, events')
    # First connection keeps its claimed row locked. Second must skip it.
    sql("SELECT nadi_enqueue_job('concurrency-1', 'synthetic', '{}'); SELECT nadi_enqueue_job('concurrency-2', 'synthetic', '{}')")
    proc = subprocess.Popen(['psql', '-X', url, '-v', 'ON_ERROR_STOP=1', '-At'],
                            stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE, text=True)
    watchdog = threading.Timer(15, proc.kill)
    watchdog.start()
    try:
        proc.stdin.write(f"SET search_path TO {schema}, public; BEGIN; SELECT id FROM nadi_claim_job('parallel-1');\n\\echo LOCKED\n")
        proc.stdin.flush()
        claimed_id = None
        while True:
            line = proc.stdout.readline().strip()
            if line == 'LOCKED':
                break
            if proc.poll() is not None:
                raise RuntimeError('Concurrent claim session exited')
            try:
                claimed_id = str(uuid.UUID(line))
            except ValueError:
                pass
        other_id = sql("SELECT id FROM nadi_claim_job('parallel-2')")[0]
        assert claimed_id and other_id != claimed_id, 'Workers claimed the same job'
        proc.stdin.write('COMMIT;\n\\q\n')
        proc.stdin.flush()
        proc.wait(timeout=10)
        assert proc.returncode == 0
    finally:
        watchdog.cancel()
        if proc.poll() is None:
            proc.kill()
            proc.wait()
    # New connection represents a replacement worker after process termination.
    sql("UPDATE job SET lease_expires_at = clock_timestamp() - interval '1 second' WHERE lease_owner = 'parallel-1'")
    assert sql("SELECT id FROM nadi_claim_job('replacement-worker')")[0] == claimed_id
    print('PASS: concurrent claims and recovery across disconnected sessions')
finally:
    sql(f'DROP SCHEMA IF EXISTS {schema} CASCADE')
