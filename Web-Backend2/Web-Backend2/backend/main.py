from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from . import models
from .database import engine
from .routes import (
    edges,
    floor_maps,
    kiosk_frontend,
    kiosks,
    node_categories,
    nodes,
    route,
)


models.Base.metadata.create_all(bind=engine)


def _ensure_sqlite_columns() -> None:
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())
    if "nodes" in table_names:
        node_columns = {column["name"] for column in inspector.get_columns("nodes")}
        node_column_sql = {
            "environment_description": "ALTER TABLE nodes ADD COLUMN environment_description VARCHAR",
            "image_description": "ALTER TABLE nodes ADD COLUMN image_description VARCHAR",
            "kiosk_code": "ALTER TABLE nodes ADD COLUMN kiosk_code VARCHAR",
            "service_floor_from": "ALTER TABLE nodes ADD COLUMN service_floor_from INTEGER",
            "service_floor_to": "ALTER TABLE nodes ADD COLUMN service_floor_to INTEGER",
            "use_when_floor_distance": "ALTER TABLE nodes ADD COLUMN use_when_floor_distance INTEGER",
            "supports_wheelchair": "ALTER TABLE nodes ADD COLUMN supports_wheelchair BOOLEAN NOT NULL DEFAULT 0",
        }
        _add_missing_columns(node_columns, node_column_sql)
    if "edges" in table_names:
        edge_columns = {column["name"] for column in inspector.get_columns("edges")}
        _add_missing_columns(
            edge_columns,
            {
                "is_hidden": "ALTER TABLE edges ADD COLUMN is_hidden BOOLEAN NOT NULL DEFAULT 0",
            },
        )


def _add_missing_columns(existing_columns: set[str], column_sql: dict[str, str]) -> None:
    with engine.begin() as connection:
        for column_name, statement in column_sql.items():
            if column_name not in existing_columns:
                connection.execute(text(statement))


_ensure_sqlite_columns()

app = FastAPI(
    title="Indoor Navigation API",
    description="Backend API for mall and building indoor navigation.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(nodes.router, prefix="/api")
app.include_router(edges.router, prefix="/api")
app.include_router(floor_maps.router, prefix="/api")
app.include_router(kiosk_frontend.router, prefix="/api")
app.include_router(node_categories.router, prefix="/api")
app.include_router(kiosks.router, prefix="/api")
app.include_router(route.router, prefix="/api")


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}
