from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Node(Base):
    __tablename__ = "nodes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    node_type: Mapped[str] = mapped_column(String, nullable=False, index=True)
    floor: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    x: Mapped[float] = mapped_column(Float, nullable=False)
    y: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    environment_description: Mapped[str | None] = mapped_column(String, nullable=True)
    image_description: Mapped[str | None] = mapped_column(String, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String, nullable=True)
    kiosk_code: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    service_floor_from: Mapped[int | None] = mapped_column(Integer, nullable=True)
    service_floor_to: Mapped[int | None] = mapped_column(Integer, nullable=True)
    use_when_floor_distance: Mapped[int | None] = mapped_column(Integer, nullable=True)
    supports_wheelchair: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    edges_from: Mapped[list["Edge"]] = relationship(
        "Edge",
        foreign_keys="Edge.from_node_id",
        back_populates="from_node",
        cascade="all, delete-orphan",
    )
    edges_to: Mapped[list["Edge"]] = relationship(
        "Edge",
        foreign_keys="Edge.to_node_id",
        back_populates="to_node",
        cascade="all, delete-orphan",
    )
    kiosks: Mapped[list["Kiosk"]] = relationship(
        "Kiosk",
        back_populates="node",
        passive_deletes=True,
    )


class Edge(Base):
    __tablename__ = "edges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    from_node_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("nodes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    to_node_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("nodes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    weight: Mapped[float] = mapped_column(Float, nullable=False)
    is_bidirectional: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    from_node: Mapped[Node] = relationship(
        "Node",
        foreign_keys=[from_node_id],
        back_populates="edges_from",
    )
    to_node: Mapped[Node] = relationship(
        "Node",
        foreign_keys=[to_node_id],
        back_populates="edges_to",
    )


class FloorMap(Base):
    __tablename__ = "floor_maps"

    floor: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    image_data_url: Mapped[str] = mapped_column(String, nullable=False)
    original_width: Mapped[float] = mapped_column(Float, nullable=False)
    original_height: Mapped[float] = mapped_column(Float, nullable=False)
    map_width: Mapped[float] = mapped_column(Float, nullable=False)
    map_height: Mapped[float] = mapped_column(Float, nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class Kiosk(Base):
    __tablename__ = "kiosks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    kiosk_code: Mapped[str] = mapped_column(
        String,
        unique=True,
        nullable=False,
        index=True,
    )
    name: Mapped[str | None] = mapped_column(String, nullable=True)
    floor: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    x: Mapped[float] = mapped_column(Float, nullable=False)
    y: Mapped[float] = mapped_column(Float, nullable=False)
    node_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("nodes.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    node: Mapped[Node | None] = relationship("Node", back_populates="kiosks")


class NodeCategory(Base):
    __tablename__ = "node_categories"

    key: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    label: Mapped[str] = mapped_column(String, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String, nullable=True)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
