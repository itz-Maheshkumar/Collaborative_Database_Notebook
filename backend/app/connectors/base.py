from abc import ABC, abstractmethod
from typing import Any


class BaseConnector(ABC):
    """Abstract Base Connector for all database engines (PostgreSQL, MySQL, MongoDB, SQLite)."""

    def __init__(self, connection_params: dict[str, Any]):
        self.params = connection_params

    @abstractmethod
    async def execute(self, query_text: str) -> dict[str, Any]:
        """Execute a query string against target database.

        Returns dict with:
            success: bool
            columns: List[str]
            rows: List[Dict[str, Any]]
            row_count: int
            error_message: Optional[str]
        """
        pass
