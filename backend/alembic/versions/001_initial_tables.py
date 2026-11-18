"""Initial tables for Users, Needs, and Fundraisers

Revision ID: 001_initial_tables
Revises: 
Create Date: 2026-11-18 06:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_tables'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False, server_default='volunteer'),
        sa.Column('unit_name', sa.String(length=255), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('points', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # Needs table
    op.create_table(
        'needs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('military_user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('target_amount', sa.Float(), nullable=False),
        sa.Column('urgency', sa.String(length=50), nullable=False, server_default='medium'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='open'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['military_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_needs_id'), 'needs', ['id'], unique=False)

    # Fundraisers table
    op.create_table(
        'fundraisers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('need_id', sa.Integer(), nullable=False),
        sa.Column('volunteer_user_id', sa.Integer(), nullable=False),
        sa.Column('jar_url', sa.String(length=500), nullable=False),
        sa.Column('goal_amount', sa.Float(), nullable=False),
        sa.Column('current_amount', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='active'),
        sa.Column('proof_image_url', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['need_id'], ['needs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['volunteer_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_fundraisers_id'), 'fundraisers', ['id'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_fundraisers_id'), table_name='fundraisers')
    op.drop_table('fundraisers')
    op.drop_index(op.f('ix_needs_id'), table_name='needs')
    op.drop_table('needs')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_table('users')
