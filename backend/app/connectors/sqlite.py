from typing import Dict, Any

from app.connectors.base import BaseConnector


class SQLiteConnector(BaseConnector):
    """Async SQLite connector using aiosqlite."""

    async def execute(self, query_text: str) -> Dict[str, Any]:
        try:
            import aiosqlite  # lazy import
        except ImportError:
            return {
                "success": False,
                "columns": [],
                "rows": [],
                "row_count": 0,
                "error_message": "aiosqlite is not installed. Run: pip install aiosqlite",
            }

        db_path = self.params.get("database_name") or ":memory:"

        try:
            async with aiosqlite.connect(db_path) as db:
                db.row_factory = aiosqlite.Row
                async with db.execute(query_text) as cursor:
                    stmt = query_text.strip().upper()

                    if stmt.startswith("SELECT") or stmt.startswith("WITH") or stmt.startswith("PRAGMA"):
                        records = await cursor.fetchall()
                        columns = [desc[0] for desc in cursor.description] if cursor.description else []
                        rows = [dict(row) for row in records]
                        return {
                            "success": True,
                            "columns": columns,
                            "rows": rows,
                            "row_count": len(rows),
                            "error_message": None,
                        }
                    else:
                        await db.commit()
                        return {
                            "success": True,
                            "columns": [],
                            "rows": [],
                            "row_count": cursor.rowcount,
                            "error_message": None,
                        }

        except Exception as exc:
            return {
                "success": False,
                "columns": [],
                "rows": [],
                "row_count": 0,
                "error_message": str(exc),
            }
