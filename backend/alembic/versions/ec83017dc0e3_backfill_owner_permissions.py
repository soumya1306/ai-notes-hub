"""backfill_owner_permissions

Revision ID: ec83017dc0e3
Revises: 5b9133122aad
Create Date: 2026-03-20 02:36:46.038018

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ec83017dc0e3'
down_revision: Union[str, Sequence[str], None] = '5b9133122aad'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Insert owner permission for every note that has no permission row at all."""
    op.execute(
        """
        INSERT INTO note_permissions (id, note_id, user_id, role, created_at)
        SELECT
            gen_random_uuid(),
            n.id,
            n.user_id,
            'owner',
            now()
        FROM notes n
        WHERE NOT EXISTS (
            SELECT 1
            FROM note_permissions np
            WHERE np.note_id = n.id
              AND np.user_id = n.user_id
        )
        """
    )


def downgrade() -> None:
    """Remove only the backfilled owner rows (those whose note has no other permissions)."""
    op.execute(
        """
        DELETE FROM note_permissions np
        WHERE np.role = 'owner'
          AND NOT EXISTS (
              SELECT 1
              FROM note_permissions other
              WHERE other.note_id = np.note_id
                AND other.id != np.id
          )
        """
    )
