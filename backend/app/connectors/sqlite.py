from typing import Dict, Any, List
import re

from app.connectors.base import BaseConnector


class SQLiteConnector(BaseConnector):
    """Async SQLite connector using aiosqlite. Supports multi-statement scripts."""

    def _split_statements(self, script: str) -> List[str]:
        # Remove comments and split by semicolon not inside quotes
        statements = []
        # Simple splitting by semicolon
        raw_stmts = [s.strip() for s in script.strip().split(";") if s.strip()]
        for s in raw_stmts:
            if s:
                statements.append(s)
        return statements

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
                statements = self._split_statements(query_text)

                if not statements:
                    return {
                        "success": True,
                        "columns": [],
                        "rows": [],
                        "row_count": 0,
                        "error_message": None,
                    }

                # If single statement
                if len(statements) == 1:
                    stmt = statements[0]
                    async with db.execute(stmt) as cursor:
                        upper_stmt = stmt.strip().upper()
                        if upper_stmt.startswith("SELECT") or upper_stmt.startswith("WITH") or upper_stmt.startswith("PRAGMA"):
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

                # If multiple statements in script:
                # Execute all statements in sequence
                total_affected = 0
                last_result = None

                for stmt in statements:
                    async with db.execute(stmt) as cursor:
                        upper_stmt = stmt.strip().upper()
                        if upper_stmt.startswith("SELECT") or upper_stmt.startswith("WITH") or upper_stmt.startswith("PRAGMA"):
                            records = await cursor.fetchall()
                            columns = [desc[0] for desc in cursor.description] if cursor.description else []
                            rows = [dict(row) for row in records]
                            last_result = {
                                "success": True,
                                "columns": columns,
                                "rows": rows,
                                "row_count": len(rows),
                                "error_message": None,
                            }
                        else:
                            total_affected += (cursor.rowcount if cursor.rowcount > 0 else 0)

                await db.commit()

                if last_result is not None:
                    return last_result

                return {
                    "success": True,
                    "columns": [],
                    "rows": [],
                    "row_count": total_affected,
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
