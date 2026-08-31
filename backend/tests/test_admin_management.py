import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.models.user import User, UserRole, UserStatus


async def _make_admin(db_session, username, email):
    from app.schemas.user import UserCreate
    from app.services.auth_service import create_user

    user = await create_user(
        db_session,
        UserCreate(username=username, email=email, password="password123"),
    )
    user.role = UserRole.ADMIN
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.mark.asyncio
async def test_admin_can_change_user_role(client: AsyncClient, db_session):
    await _make_admin(db_session, "adminuser1", "admin1@example.com")

    # Regular user to be promoted
    reg = await client.post(
        "/api/v1/auth/register",
        json={"username": "plainuser", "email": "plain@example.com", "password": "password123"},
    )
    assert reg.status_code == 201
    target_id = reg.json()["id"]

    admin_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin1@example.com", "password": "password123"},
    )
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}

    # This is exactly what the frontend UserManagementTable sends when the
    # admin picks "admin" from the role <select>.
    resp = await client.patch(
        f"/api/v1/admin/users/{target_id}",
        json={"role": "admin"},
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["role"] == "admin"

    # Confirm it actually persisted to the DB as the real enum member.
    row = await db_session.execute(select(User).where(User.id == target_id))
    persisted = row.scalars().first()
    assert persisted.role == UserRole.ADMIN


@pytest.mark.asyncio
async def test_admin_can_disable_user_and_disabled_user_cannot_login(client: AsyncClient, db_session):
    await _make_admin(db_session, "adminuser2", "admin2@example.com")

    reg = await client.post(
        "/api/v1/auth/register",
        json={"username": "todisable", "email": "todisable@example.com", "password": "password123"},
    )
    assert reg.status_code == 201
    target_id = reg.json()["id"]

    admin_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin2@example.com", "password": "password123"},
    )
    admin_token = admin_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Sanity check: list_users should report this user active before disabling.
    listing = await client.get("/api/v1/admin/users", headers=headers)
    assert listing.status_code == 200
    listed = next(u for u in listing.json() if u["id"] == target_id)
    assert listed["is_active"] is True

    # This is exactly what the frontend sends when the admin clicks "Deactivate".
    resp = await client.patch(
        f"/api/v1/admin/users/{target_id}",
        json={"is_active": False},
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["is_active"] is False

    row = await db_session.execute(select(User).where(User.id == target_id))
    persisted = row.scalars().first()
    assert persisted.status == UserStatus.BLOCKED

    # The disabled user must now be rejected at login.
    blocked_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "todisable@example.com", "password": "password123"},
    )
    assert blocked_login.status_code == 403

    # And the list endpoint should reflect it too.
    listing2 = await client.get("/api/v1/admin/users", headers=headers)
    listed2 = next(u for u in listing2.json() if u["id"] == target_id)
    assert listed2["is_active"] is False


@pytest.mark.asyncio
async def test_invalid_role_is_rejected_cleanly(client: AsyncClient, db_session):
    await _make_admin(db_session, "adminuser3", "admin3@example.com")

    reg = await client.post(
        "/api/v1/auth/register",
        json={"username": "someuser", "email": "someuser@example.com", "password": "password123"},
    )
    target_id = reg.json()["id"]

    admin_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin3@example.com", "password": "password123"},
    )
    admin_token = admin_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}

    resp = await client.patch(
        f"/api/v1/admin/users/{target_id}",
        json={"role": "superadmin"},
        headers=headers,
    )
    assert resp.status_code == 400
