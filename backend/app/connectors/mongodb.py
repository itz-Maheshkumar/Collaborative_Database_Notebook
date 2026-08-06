from typing import Dict, Any

from app.connectors.base import BaseConnector


class MongoDBConnector(BaseConnector):
    """Async MongoDB connector using Motor.

    Supports a limited subset of MongoDB operations expressed as JSON commands:
        { "operation": "find", "collection": "users", "filter": {}, "limit": 100 }
        { "operation": "insertOne", "collection": "users", "document": { ... } }
        { "operation": "updateMany", "collection": "users", "filter": {}, "update": { "$set": {} } }
        { "operation": "deleteOne", "collection": "users", "filter": {} }
        { "operation": "aggregate", "collection": "users", "pipeline": [...] }
    """

    async def execute(self, query_text: str) -> Dict[str, Any]:
        try:
            import motor.motor_asyncio as motor  # lazy import
            import json
        except ImportError:
            return {
                "success": False,
                "columns": [],
                "rows": [],
                "row_count": 0,
                "error_message": "motor is not installed. Run: pip install motor",
            }

        try:
            command: Dict[str, Any] = json.loads(query_text)
        except Exception:
            return {
                "success": False,
                "columns": [],
                "rows": [],
                "row_count": 0,
                "error_message": (
                    "MongoDB queries must be JSON. Example:\n"
                    '{"operation":"find","collection":"users","filter":{},"limit":50}'
                ),
            }

        host = self.params.get("host", "localhost")
        port = int(self.params.get("port", 27017))
        database_name = self.params.get("database_name", "test")
        username = self.params.get("username")
        password = self.params.get("password")

        if username and password:
            uri = f"mongodb://{username}:{password}@{host}:{port}/{database_name}"
        else:
            uri = f"mongodb://{host}:{port}"

        try:
            client = motor.AsyncIOMotorClient(uri, serverSelectionTimeoutMS=10000)
            db = client[database_name]
            collection_name = command.get("collection", "")
            operation = command.get("operation", "").lower()
            collection = db[collection_name]

            if operation == "find":
                cursor = collection.find(
                    command.get("filter", {}),
                    limit=command.get("limit", 100),
                )
                documents = await cursor.to_list(length=command.get("limit", 100))
                rows = [{k: str(v) for k, v in doc.items()} for doc in documents]
                columns = list(rows[0].keys()) if rows else []
                return {
                    "success": True,
                    "columns": columns,
                    "rows": rows,
                    "row_count": len(rows),
                    "error_message": None,
                }

            elif operation == "insertone":
                result = await collection.insert_one(command.get("document", {}))
                return {
                    "success": True,
                    "columns": ["inserted_id"],
                    "rows": [{"inserted_id": str(result.inserted_id)}],
                    "row_count": 1,
                    "error_message": None,
                }

            elif operation == "updatemany":
                result = await collection.update_many(
                    command.get("filter", {}), command.get("update", {})
                )
                return {
                    "success": True,
                    "columns": ["matched_count", "modified_count"],
                    "rows": [{"matched_count": result.matched_count, "modified_count": result.modified_count}],
                    "row_count": result.modified_count,
                    "error_message": None,
                }

            elif operation == "deleteone":
                result = await collection.delete_one(command.get("filter", {}))
                return {
                    "success": True,
                    "columns": ["deleted_count"],
                    "rows": [{"deleted_count": result.deleted_count}],
                    "row_count": result.deleted_count,
                    "error_message": None,
                }

            elif operation == "aggregate":
                cursor = collection.aggregate(command.get("pipeline", []))
                documents = await cursor.to_list(length=200)
                rows = [{k: str(v) for k, v in doc.items()} for doc in documents]
                columns = list(rows[0].keys()) if rows else []
                return {
                    "success": True,
                    "columns": columns,
                    "rows": rows,
                    "row_count": len(rows),
                    "error_message": None,
                }

            else:
                return {
                    "success": False,
                    "columns": [],
                    "rows": [],
                    "row_count": 0,
                    "error_message": f"Unknown operation '{operation}'. Supported: find, insertOne, updateMany, deleteOne, aggregate",
                }

        except Exception as exc:
            return {
                "success": False,
                "columns": [],
                "rows": [],
                "row_count": 0,
                "error_message": str(exc),
            }
        finally:
            try:
                client.close()
            except Exception:
                pass
