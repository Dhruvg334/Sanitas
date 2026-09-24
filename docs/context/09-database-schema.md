# Database Schema

PostgreSQL via Neon.

## `analyses`

```sql
id uuid primary key
status varchar not null
source_type varchar not null
original_filename varchar null
sha256 char(64) not null
size_bytes integer null
page_count integer null
document_quality varchar null
quality_issues jsonb not null default '[]'
canonical_document jsonb null
clinical_extraction jsonb null
clinical_review jsonb null
model_name varchar null
prompt_versions jsonb not null default '{}'
timings_ms jsonb not null default '{}'
error_code varchar null
error_message_safe text null
created_at timestamptz not null
updated_at timestamptz not null
completed_at timestamptz null
```

Indexes:
- `created_at desc`
- `status`
- optionally `sha256`

## `processing_events`

```sql
id bigserial primary key
analysis_id uuid references analyses(id) on delete cascade
stage varchar not null
status varchar not null
duration_ms integer null
metadata jsonb not null default '{}'
created_at timestamptz not null
```

Index:
- `(analysis_id, created_at)`

Metadata must not contain raw document text.

## `usage_counters`

Optional abuse-control table for public deployment.

```sql
id bigserial primary key
actor_hash char(64) not null
usage_date date not null
request_count integer not null default 0
updated_at timestamptz not null
unique(actor_hash, usage_date)
```

`actor_hash` is an HMAC of request IP/session signal using a server secret. Do not store raw IP solely for rate limiting.

## Why JSONB for reports

The report/extraction contract is naturally hierarchical and versioned. JSONB:
- keeps exact model/schema shape
- avoids dozens of sparse relational tables for an internship assignment
- remains queryable
- lets schema version evolve

Core lifecycle metadata stays relational for indexing and history.

## Migration policy

Every schema change uses Alembic.
No runtime `create_all()` in deployed production path.
Migrations live in source control.
