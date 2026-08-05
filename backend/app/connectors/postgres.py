from typing import Dict, Any

from app.connectors.base import BaseConnector


class PostgresConnector(BaseConnector):
    """Async PostgreSQL connector using asyncpg."""

    async def execute(self, query_text: str) -> Dict[str, Any]:
        try:
            import asyncpg  # imported lazily so the app starts without asyncpg if not installed
        except ImportError:
            return {
                "success": False,
                "columns": [],
                "rows": [],
                "row_count": 0,
                "error_message": "asyncpg is not installed. Run: pip install asyncpg",
            }

        try:
            conn = await asyncpg.connect(
                host=self.params.get("host", "localhost"),
                port=int(self.params.get("port", 5432)),
                database=self.params.get("database_name", ""),
                user=self.params.get("username", ""),
                password=self.params.get("password", ""),
                timeout=15,
            )

            try:
                stmt = query_text.strip().upper()
                if stmt.startswith("SELECT") or stmt.startswith("WITH"):
                    records = await conn.fetch(query_text)
                    if not records:
                        return {
                            "success": True,
                            "columns": [],
                            "rows": [],
                            "row_count": 0,
                            "error_message": None,
                        }
                    columns = list(records[0].keys())
                    rows = [dict(r) for r in records]
                    return {
                        "success": True,
                        "columns": columns,
                        "rows": rows,
                        "row_count": len(rows),
                        "error_message": None,
                    }
                else:
                    status = await conn.execute(query_text)
                    row_count = int(status.split()[-1]) if status and status.split()[-1].isdigit() else 0
                    return {
                        "success": True,
                        "columns": [],
                        "rows": [],
                        "row_count": row_count,
                        "error_message": None,
                    }
            finally:
                await conn.close()

        except Exception as exc:
            return {
                "success": False,
                "columns": [],
                "rows": [],
                "row_count": 0,
                "error_message": str(exc),
            }
