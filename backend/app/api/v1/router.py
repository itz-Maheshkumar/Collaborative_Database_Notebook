from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.connections import router as connections_router
from app.api.v1.notebooks import router as notebooks_router
from app.api.v1.query import router as query_router

api_v1_router = APIRouter()

api_v1_router.include_router(auth_router)
api_v1_router.include_router(connections_router)
api_v1_router.include_router(notebooks_router)
api_v1_router.include_router(query_router)
