import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_and_login(client: AsyncClient):
    # 1. Register a new user
    reg_payload = {
        "email": "testuser@example.com",
        "password": "password123",
        "full_name": "Test User",
    }
    reg_resp = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_resp.status_code == 201
    reg_data = reg_resp.json()
    assert reg_data["user"]["email"] == "testuser@example.com"
    assert "access_token" in reg_data

    # 2. Login with registered user
    login_payload = {
        "email": "testuser@example.com",
        "password": "password123",
    }
    login_resp = await client.post("/api/v1/auth/login", json=login_payload)
    assert login_resp.status_code == 200
    token_data = login_resp.json()
    token = token_data["access_token"]
    assert token

    # 3. Get profile (/me)
    headers = {"Authorization": f"Bearer {token}"}
    me_resp = await client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["email"] == "testuser@example.com"
