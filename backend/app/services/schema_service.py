from typing import Dict, Any, List

from app.models.connection import DatabaseEngine
from app.schemas.schema import SchemaTreeResponse, TableInfo, ColumnInfo


async def introspect_postgres(params: Dict[str, Any]) -> SchemaTreeResponse:
    try:
        import asyncpg
    except ImportError:
        return SchemaTreeResponse(
            engine="postgresql",
            database_name=params.get("database_name", ""),
            error_message="asyncpg not installed",
        )

    try:
        conn = await asyncpg.connect(
            host=params.get("host", "localhost"),
            port=int(params.get("port", 5432)),
            database=params.get("database_name", ""),
            user=params.get("username", ""),
            password=params.get("password", ""),
            timeout=10,
        )
        try:
            # Query tables
            tables_records = await conn.fetch(
                """
                SELECT table_name, table_type
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name;
                """
            )
            # Query columns
            cols_records = await conn.fetch(
                """
                SELECT table_name, column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'public'
                ORDER BY table_name, ordinal_position;
                """
            )

            cols_by_table: Dict[str, List[ColumnInfo]] = {}
            for col in cols_records:
                t_name = col["table_name"]
                if t_name not in cols_by_table:
                    cols_by_table[t_name] = []
                cols_by_table[t_name].append(
                    ColumnInfo(
                        name=col["column_name"],
                        data_type=col["data_type"],
                        is_nullable=col["is_nullable"] == "YES",
                    )
                )

            tables = []
            for t in tables_records:
                t_name = t["table_name"]
                t_type = "view" if "VIEW" in t["table_type"] else "table"
                tables.append(
                    TableInfo(
                        name=t_name,
                        type=t_type,
                        columns=cols_by_table.get(t_name, []),
                    )
                )

            return SchemaTreeResponse(
                engine="postgresql",
                database_name=params.get("database_name", ""),
                tables=tables,
            )
        finally:
            await conn.close()
    except Exception as exc:
        return SchemaTreeResponse(
            engine="postgresql",
            database_name=params.get("database_name", ""),
            error_message=str(exc),
        )


async def introspect_mysql(params: Dict[str, Any]) -> SchemaTreeResponse:
    try:
        import aiomysql
    except ImportError:
        return SchemaTreeResponse(
            engine="mysql",
            database_name=params.get("database_name", ""),
            error_message="aiomysql not installed",
        )

    db_name = params.get("database_name", "")
    try:
        conn = await aiomysql.connect(
            host=params.get("host", "localhost"),
            port=int(params.get("port", 3306)),
            db=db_name,
            user=params.get("username", ""),
            password=params.get("password", ""),
            connect_timeout=10,
        )
        try:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute(
                    """
                    SELECT table_name, column_name, data_type, is_nullable
                    FROM information_schema.columns
                    WHERE table_schema = %s
                    ORDER BY table_name, ordinal_position;
                    """,
                    (db_name,),
                )
                rows = await cursor.fetchall()

                cols_by_table: Dict[str, List[ColumnInfo]] = {}
                for row in rows:
                    t_name = row["table_name"]
                    if t_name not in cols_by_table:
                        cols_by_table[t_name] = []
                    cols_by_table[t_name].append(
                        ColumnInfo(
                            name=row["column_name"],
                            data_type=row["data_type"],
                            is_nullable=row["is_nullable"] == "YES",
                        )
                    )

                tables = [
                    TableInfo(name=t_name, type="table", columns=cols)
                    for t_name, cols in cols_by_table.items()
                ]

                return SchemaTreeResponse(
                    engine="mysql",
                    database_name=db_name,
                    tables=tables,
                )
        finally:
            conn.close()
    except Exception as exc:
        return SchemaTreeResponse(
            engine="mysql",
            database_name=db_name,
            error_message=str(exc),
        )


async def introspect_sqlite(params: Dict[str, Any]) -> SchemaTreeResponse:
    try:
        import aiosqlite
    except ImportError:
        return SchemaTreeResponse(
            engine="sqlite",
            database_name=params.get("database_name") or ":memory:",
            error_message="aiosqlite not installed",
        )

    db_path = params.get("database_name") or ":memory:"

    try:
        async with aiosqlite.connect(db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(
                "SELECT name, type FROM sqlite_master WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%';"
            ) as cursor:
                table_rows = await cursor.fetchall()

            tables = []
            for t_row in table_rows:
                t_name = t_row["name"]
                t_type = t_row["type"]

                async with db.execute(f"PRAGMA table_info('{t_name}');") as pragma_cur:
                    col_rows = await pragma_cur.fetchall()

                cols = [
                    ColumnInfo(
                        name=c["name"],
                        data_type=c["type"] or "TEXT",
                        is_nullable=not bool(c["notnull"]),
                        is_primary_key=bool(c["pk"]),
                    )
                    for c in col_rows
                ]
                tables.append(TableInfo(name=t_name, type=t_type, columns=cols))

            return SchemaTreeResponse(
                engine="sqlite",
                database_name=db_path,
                tables=tables,
            )
    except Exception as exc:
        return SchemaTreeResponse(
            engine="sqlite",
            database_name=db_path,
            error_message=str(exc),
        )


async def introspect_mongodb(params: Dict[str, Any]) -> SchemaTreeResponse:
    try:
        import motor.motor_asyncio as motor
    except ImportError:
        return SchemaTreeResponse(
            engine="mongodb",
            database_name=params.get("database_name", "test"),
            error_message="motor not installed",
        )

    host = params.get("host", "localhost")
    port = int(params.get("port", 27017))
    db_name = params.get("database_name", "test")
    username = params.get("username")
    password = params.get("password")

    if username and password:
        uri = f"mongodb://{username}:{password}@{host}:{port}/{db_name}"
    else:
        uri = f"mongodb://{host}:{port}"

    try:
        client = motor.AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
        db = client[db_name]
        collection_names = await db.list_collection_names()

        tables = []
        for coll_name in collection_names:
            if coll_name.startswith("system."):
                continue
            # Sample 1 document to infer schema fields
            sample_doc = await db[coll_name].find_one()
            cols = []
            if sample_doc:
                for k, v in sample_doc.items():
                    type_str = type(v).__name__
                    cols.append(
                        ColumnInfo(
                            name=k,
                            data_type=type_str,
                            is_primary_key=(k == "_id"),
                        )
                    )

            tables.append(TableInfo(name=coll_name, type="collection", columns=cols))

        client.close()
        return SchemaTreeResponse(
            engine="mongodb",
            database_name=db_name,
            tables=tables,
        )
    except Exception as exc:
        return SchemaTreeResponse(
            engine="mongodb",
            database_name=db_name,
            error_message=str(exc),
        )


async def get_schema_tree(params: Dict[str, Any]) -> SchemaTreeResponse:
    """Dispatches schema introspection based on database engine."""
    engine: DatabaseEngine = params["engine"]

    if engine == DatabaseEngine.POSTGRESQL:
        return await introspect_postgres(params)
    elif engine == DatabaseEngine.MYSQL:
        return await introspect_mysql(params)
    elif engine == DatabaseEngine.SQLITE:
        return await introspect_sqlite(params)
    elif engine == DatabaseEngine.MONGODB:
        return await introspect_mongodb(params)
    else:
        return SchemaTreeResponse(
            engine=str(engine),
            database_name=params.get("database_name", ""),
            error_message=f"Unsupported engine: {engine}",
        )
