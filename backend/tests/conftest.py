import os

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.base import Base
from app.db.session import get_db
from app.main import app

# Defaults to an in-memory SQLite DB for fast local runs. CI sets
# TEST_DATABASE_URL to the Postgres service it already provisions, so the
# suite runs against the same engine production actually uses (see
# docker-compose.yml) instead of silently testing against SQLite only.
TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", "sqlite+aiosqlite:///:memory:")


def _build_engine():
    # `check_same_thread` is a SQLite/aiosqlite-only DBAPI arg; passing it
    # to asyncpg (or any other driver) raises a TypeError, so only apply it
    # when the test DB is actually SQLite.
    connect_args = {"check_same_thread": False} if TEST_DATABASE_URL.startswith("sqlite") else {}
    return create_async_engine(TEST_DATABASE_URL, connect_args=connect_args)


@pytest_asyncio.fixture
async def db_session():
    """Yield a DB session backed by a fresh engine, scoped to this test.

    A single engine shared across the whole test session (as this used to
    be built) keeps its asyncpg connection pool alive across tests. Under
    `--asyncio-mode=auto`, pytest-asyncio 0.23 runs each test on its own
    event loop by default, and a pooled asyncpg connection first opened on
    one test's loop then reused on another's raises "InterfaceError:
    cannot perform operation: another operation is in progress" (or
    "attached to a different loop") — aiosqlite tolerates this silently,
    asyncpg does not. Building the engine fresh inside this fixture keeps
    it, its pool, and the test that uses it on the same loop throughout,
    which avoids the mismatch entirely rather than fighting pytest-asyncio's
    loop scoping.
    """
    engine = _build_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    async with session_factory() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
