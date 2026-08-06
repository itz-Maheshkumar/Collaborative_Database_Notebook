import time
from typing import Dict, Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.connection import Connection, DatabaseEngine
from app.core.security import decrypt_string
from app.connectors.postgres import PostgresConnector
from app.connectors.mysql import MySQLConnector
from app.connectors.sqlite import SQLiteConnector
from app.connectors.mongodb import MongoDBConnector


async def get_connection_params(
    db: AsyncSession,
    connection_id: int,
    user_id: int,
) -> Optional[Dict[str, Any]]:
    """Fetch a saved connection and decrypt credentials."""
    result = await db.execute(
        select(Connection).where(
            Connection.id == connection_id,
            Connection.user_id == user_id,
        )
    )
    conn = result.scalars().first()
    if not conn:
        return None

    password: Optional[str] = None
    if conn.encrypted_password:
        try:
            password = decrypt_string(conn.encrypted_password)
        except Exception:
            password = None

    return {
        "engine": conn.engine,
        "host": conn.host,
        "port": conn.port,
        "database_name": conn.database_name,
        "username": conn.username,
        "password": password,
        "extra_params": conn.extra_params,
    }


async def execute_query(
    params: Dict[str, Any],
    query_text: str,
) -> Dict[str, Any]:
    """Route query to the correct connector and return a standardised result."""
    engine: DatabaseEngine = params["engine"]
    start = time.perf_counter()

    if engine == DatabaseEngine.POSTGRESQL:
        connector = PostgresConnector(params)
    elif engine == DatabaseEngine.MYSQL:
        connector = MySQLConnector(params)
    elif engine == DatabaseEngine.SQLITE:
        connector = SQLiteConnector(params)
    elif engine == DatabaseEngine.MONGODB:
        connector = MongoDBConnector(params)
    else:
        return {
            "success": False,
            "columns": [],
            "rows": [],
            "row_count": 0,
            "execution_time_ms": 0.0,
            "error_message": f"Unsupported engine: {engine}",
        }

    result = await connector.execute(query_text)
    elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
    result["execution_time_ms"] = elapsed_ms
    result["engine"] = engine.value if hasattr(engine, "value") else str(engine)
    return result
