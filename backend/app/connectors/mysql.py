from typing import Dict, Any

from app.connectors.base import BaseConnector


class MySQLConnector(BaseConnector):
    """Async MySQL connector using aiomysql."""

    async def execute(self, query_text: str) -> Dict[str, Any]:
        try:
            import aiomysql  # lazy import
        except ImportError:
            return {
                "success": False,
                "columns": [],
                "rows": [],
                "row_count": 0,
                "error_message": "aiomysql is not installed. Run: pip install aiomysql",
            }

        try:
            conn = await aiomysql.connect(
                host=self.params.get("host", "localhost"),
                port=int(self.params.get("port", 3306)),
                db=self.params.get("database_name", ""),
                user=self.params.get("username", ""),
                password=self.params.get("password", ""),
                autocommit=True,
                connect_timeout=15,
            )

            try:
                async with conn.cursor(aiomysql.DictCursor) as cursor:
                    await cursor.execute(query_text)
                    stmt = query_text.strip().upper()

                    if stmt.startswith("SELECT") or stmt.startswith("WITH") or stmt.startswith("SHOW") or stmt.startswith("DESCRIBE"):
                        records = await cursor.fetchall()
                        columns = [col[0] for col in cursor.description] if cursor.description else []
                        rows = [dict(r) for r in (records or [])]
                        return {
                            "success": True,
                            "columns": columns,
                            "rows": rows,
                            "row_count": len(rows),
                            "error_message": None,
                        }
                    else:
                        return {
                            "success": True,
                            "columns": [],
                            "rows": [],
                            "row_count": cursor.rowcount,
                            "error_message": None,
                        }
            finally:
                conn.close()

        except Exception as exc:
            return {
                "success": False,
                "columns": [],
                "rows": [],
                "row_count": 0,
                "error_message": str(exc),
            }
