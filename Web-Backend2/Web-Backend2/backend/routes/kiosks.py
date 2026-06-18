from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db


router = APIRouter(prefix="/kiosks", tags=["kiosks"])


@router.get("", response_model=list[schemas.KioskResponse])
def get_kiosks(
    floor: int | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(models.Kiosk)
    if floor is not None:
        query = query.filter(models.Kiosk.floor == floor)
    if is_active is not None:
        query = query.filter(models.Kiosk.is_active.is_(is_active))
    return query.order_by(models.Kiosk.floor, models.Kiosk.kiosk_code).all()


@router.post(
    "",
    response_model=schemas.KioskResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_kiosk(kiosk: schemas.KioskCreate, db: Session = Depends(get_db)):
    _ensure_kiosk_code_available(db, kiosk.kiosk_code)

    node_id = _resolve_kiosk_node(db, kiosk)
    if node_id is not None and not kiosk.create_node:
        _get_node_or_404(db, node_id)

    db_kiosk = models.Kiosk(
        kiosk_code=kiosk.kiosk_code,
        name=kiosk.name,
        floor=kiosk.floor,
        x=kiosk.x,
        y=kiosk.y,
        node_id=node_id,
        is_active=kiosk.is_active,
    )
    db.add(db_kiosk)
    db.commit()
    db.refresh(db_kiosk)
    return db_kiosk


@router.get("/{kiosk_id}", response_model=schemas.KioskResponse)
def get_kiosk(kiosk_id: int, db: Session = Depends(get_db)):
    return _get_kiosk_or_404(db, kiosk_id)


@router.put("/{kiosk_id}", response_model=schemas.KioskResponse)
def update_kiosk(
    kiosk_id: int,
    kiosk_update: schemas.KioskUpdate,
    db: Session = Depends(get_db),
):
    db_kiosk = _get_kiosk_or_404(db, kiosk_id)
    update_data = kiosk_update.model_dump(exclude_unset=True)
    create_node = bool(update_data.pop("create_node", False))

    if "kiosk_code" in update_data:
        _ensure_kiosk_code_available(
            db,
            update_data["kiosk_code"],
            exclude_kiosk_id=kiosk_id,
        )

    if create_node:
        if update_data.get("node_id") is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Use either node_id or create_node, not both",
            )
        node = _create_kiosk_node(
            db=db,
            kiosk_code=update_data.get("kiosk_code", db_kiosk.kiosk_code),
            name=update_data.get("name", db_kiosk.name),
            floor=update_data.get("floor", db_kiosk.floor),
            x=update_data.get("x", db_kiosk.x),
            y=update_data.get("y", db_kiosk.y),
        )
        update_data["node_id"] = node.id
    elif "node_id" in update_data and update_data["node_id"] is not None:
        _get_node_or_404(db, update_data["node_id"])

    for field, value in update_data.items():
        setattr(db_kiosk, field, value)

    db.commit()
    db.refresh(db_kiosk)
    return db_kiosk


@router.delete("/{kiosk_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_kiosk(kiosk_id: int, db: Session = Depends(get_db)):
    db_kiosk = _get_kiosk_or_404(db, kiosk_id)
    db.delete(db_kiosk)
    db.commit()
    return None


def _get_kiosk_or_404(db: Session, kiosk_id: int) -> models.Kiosk:
    db_kiosk = db.get(models.Kiosk, kiosk_id)
    if db_kiosk is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kiosk not found",
        )
    return db_kiosk


def _get_node_or_404(db: Session, node_id: int) -> models.Node:
    db_node = db.get(models.Node, node_id)
    if db_node is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found",
        )
    return db_node


def _resolve_kiosk_node(db: Session, kiosk: schemas.KioskCreate) -> int | None:
    if not kiosk.create_node:
        return kiosk.node_id
    if kiosk.node_id is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use either node_id or create_node, not both",
        )
    node = _create_kiosk_node(
        db=db,
        kiosk_code=kiosk.kiosk_code,
        name=kiosk.name,
        floor=kiosk.floor,
        x=kiosk.x,
        y=kiosk.y,
    )
    return node.id


def _create_kiosk_node(
    db: Session,
    kiosk_code: str,
    name: str | None,
    floor: int,
    x: float,
    y: float,
) -> models.Node:
    node = models.Node(
        name=name or kiosk_code,
        node_type="kiosk",
        floor=floor,
        x=x,
        y=y,
        description=f"Kiosk {kiosk_code}",
        kiosk_code=kiosk_code,
    )
    db.add(node)
    db.flush()
    return node


def _ensure_kiosk_code_available(
    db: Session,
    kiosk_code: str,
    exclude_kiosk_id: int | None = None,
) -> None:
    query = db.query(models.Kiosk).filter(models.Kiosk.kiosk_code == kiosk_code)
    if exclude_kiosk_id is not None:
        query = query.filter(models.Kiosk.id != exclude_kiosk_id)
    if query.first() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="kiosk_code already exists",
        )
