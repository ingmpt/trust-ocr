"""agregar rol de usuario y plantillas borrador

Revision ID: c1a2b3d4e5f6
Revises: 0a4da6b42d27
Create Date: 2026-09-16 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c1a2b3d4e5f6'
down_revision = '0a4da6b42d27'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('role', sa.String(length=20), nullable=False, server_default='user'))
    op.add_column('document_templates', sa.Column('is_draft', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    op.drop_column('document_templates', 'is_draft')
    op.drop_column('users', 'role')
