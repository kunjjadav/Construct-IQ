"""
Row-Level Security (RLS) policies for multi-tenant data isolation.

This migration enables PostgreSQL Row-Level Security on financial tables
to enforce data visibility at the database layer — a layered security
measure that protects against application-layer RBAC bypass.

These policies use PostgreSQL-specific features:
- ALTER TABLE ... ENABLE ROW LEVEL SECURITY
- CREATE POLICY ... USING (...)
- current_setting() for session variable access

On SQLite (development mode), this migration dynamically bypasses PostgreSQL-specific DDL
using connection.vendor checks.
"""

from django.db import migrations


def apply_rls(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return

    schema_editor.execute("""
        -- 1. EXPENSES TABLE
        ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
        ALTER TABLE expenses FORCE ROW LEVEL SECURITY;

        CREATE POLICY expense_member_access ON expenses
            FOR SELECT
            USING (
                project_id IN (
                    SELECT project_id FROM project_members
                    WHERE user_id = current_setting('app.current_user_id', true)::int
                )
                OR current_setting('app.current_user_role', true) IN ('ADMIN', 'AGENT')
            );

        CREATE POLICY expense_client_visibility ON expenses
            FOR SELECT
            USING (
                CASE
                    WHEN current_setting('app.current_user_role', true) = 'CLIENT'
                    THEN status IN ('APPROVED', 'CONSENT_REQUIRED')
                    ELSE TRUE
                END
            );

        CREATE POLICY expense_insert_policy ON expenses
            FOR INSERT
            WITH CHECK (
                current_setting('app.current_user_role', true) IN (
                    'ADMIN', 'AGENT', 'SITE_OFFICER'
                )
            );

        CREATE POLICY expense_update_policy ON expenses
            FOR UPDATE
            USING (
                current_setting('app.current_user_role', true) IN ('ADMIN', 'AGENT')
                OR (
                    created_by_id = current_setting('app.current_user_id', true)::int
                    AND status = 'DRAFT'
                )
            );

        -- 2. EVM BASELINES TABLE
        ALTER TABLE evm_baselines ENABLE ROW LEVEL SECURITY;
        ALTER TABLE evm_baselines FORCE ROW LEVEL SECURITY;

        CREATE POLICY evm_baseline_member_access ON evm_baselines
            FOR SELECT
            USING (
                project_id IN (
                    SELECT project_id FROM project_members
                    WHERE user_id = current_setting('app.current_user_id', true)::int
                )
                OR current_setting('app.current_user_role', true) IN ('ADMIN', 'AGENT')
            );

        CREATE POLICY evm_baseline_write_policy ON evm_baselines
            FOR ALL
            USING (
                current_setting('app.current_user_role', true) IN ('ADMIN', 'AGENT')
            )
            WITH CHECK (
                current_setting('app.current_user_role', true) IN ('ADMIN', 'AGENT')
            );

        -- 3. IDEMPOTENCY RECORDS
        ALTER TABLE idempotency_records ENABLE ROW LEVEL SECURITY;
        ALTER TABLE idempotency_records FORCE ROW LEVEL SECURITY;

        CREATE POLICY idempotency_user_isolation ON idempotency_records
            FOR ALL
            USING (
                user_id = current_setting('app.current_user_id', true)::int
                OR current_setting('app.current_user_role', true) = 'ADMIN'
            )
            WITH CHECK (
                user_id = current_setting('app.current_user_id', true)::int
            );
    """)


def revert_rls(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return

    schema_editor.execute("""
        DROP POLICY IF EXISTS expense_update_policy ON expenses;
        DROP POLICY IF EXISTS expense_insert_policy ON expenses;
        DROP POLICY IF EXISTS expense_client_visibility ON expenses;
        DROP POLICY IF EXISTS expense_member_access ON expenses;
        ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS evm_baseline_write_policy ON evm_baselines;
        DROP POLICY IF EXISTS evm_baseline_member_access ON evm_baselines;
        ALTER TABLE evm_baselines DISABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS idempotency_user_isolation ON idempotency_records;
        ALTER TABLE idempotency_records DISABLE ROW LEVEL SECURITY;
    """)


class Migration(migrations.Migration):
    dependencies = [
        ("projects", "0010_milestone_signature_hash_and_more"),
    ]

    operations = [
        migrations.RunPython(apply_rls, revert_rls),
    ]
