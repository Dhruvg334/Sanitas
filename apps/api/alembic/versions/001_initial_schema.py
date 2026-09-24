"""Initial schema: analyses and processing_events tables

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-25 03:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    json_type = sa.JSON().with_variant(postgresql.JSONB(), 'postgresql')
    uuid_type = sa.Uuid(as_uuid=True).with_variant(postgresql.UUID(as_uuid=True), 'postgresql')

    op.create_table(
        'analyses',
        sa.Column('id', uuid_type, primary_key=True, nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('source_type', sa.String(50), nullable=False),
        sa.Column('original_filename', sa.String(255), nullable=True),
        sa.Column('sha256', sa.String(64), nullable=False),
        sa.Column('size_bytes', sa.Integer(), nullable=True),
        sa.Column('page_count', sa.Integer(), nullable=True),
        sa.Column('document_quality', sa.String(50), nullable=True),
        sa.Column('quality_issues', json_type, nullable=False, server_default='[]'),
        sa.Column('canonical_document', json_type, nullable=True),
        sa.Column('clinical_extraction', json_type, nullable=True),
        sa.Column('clinical_review', json_type, nullable=True),
        sa.Column('model_name', sa.String(100), nullable=True),
        sa.Column('prompt_versions', json_type, nullable=False, server_default='{}'),
        sa.Column('timings_ms', json_type, nullable=False, server_default='{}'),
        sa.Column('error_code', sa.String(50), nullable=True),
        sa.Column('error_message_safe', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_analyses_status', 'analyses', ['status'])
    op.create_index('ix_analyses_sha256', 'analyses', ['sha256'])
    op.create_index('ix_analyses_created_at_desc', 'analyses', [sa.text('created_at DESC')])

    op.create_table(
        'processing_events',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True, nullable=False),
        sa.Column('analysis_id', uuid_type, sa.ForeignKey('analyses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('stage', sa.String(50), nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('duration_ms', sa.Integer(), nullable=True),
        sa.Column('metadata_json', json_type, nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_processing_events_analysis_created', 'processing_events', ['analysis_id', 'created_at'])


def downgrade() -> None:
    op.drop_table('processing_events')
    op.drop_table('analyses')
