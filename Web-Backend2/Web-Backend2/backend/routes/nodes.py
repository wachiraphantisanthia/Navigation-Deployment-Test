from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db


router = APIRouter(prefix="/nodes", tags=["nodes"])


@router.post(
    "",
    response_model=schemas.NodeResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_node(node: schemas.NodeCreate, db: Session = Depends(get_db)):
    db_node = models.Node(**node.model_dump())
    db.add(db_node)
    db.commit()
    db.refresh(db_node)
    return db_node


@router.get("", response_model=list[schemas.NodeResponse])
def get_nodes(
    floor: int | None = Query(default=None),
    node_type: str | None = Query(default=None),
    include_hidden: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    query = db.query(models.Node)
    if floor is not None:
        query = query.filter(models.Node.floor == floor)
    if node_type is not None:
        query = query.filter(models.Node.node_type == node_type)
    if not include_hidden:
        query = query.filter(models.Node.is_hidden.is_(False))
    return query.order_by(models.Node.floor, models.Node.name).all()


@router.get("/{node_id}", response_model=schemas.NodeResponse)
def get_node(node_id: int, db: Session = Depends(get_db)):
    db_node = db.get(models.Node, node_id)
    if db_node is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found",
        )
    return db_node


@router.put("/{node_id}", response_model=schemas.NodeResponse)
def update_node(
    node_id: int,
    node_update: schemas.NodeUpdate,
    db: Session = Depends(get_db),
):
    db_node = db.get(models.Node, node_id)
    if db_node is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found",
        )

    update_data = node_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_node, field, value)

    db.commit()
    db.refresh(db_node)
    return db_node


@router.delete("/{node_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_node(node_id: int, db: Session = Depends(get_db)):
    db_node = db.get(models.Node, node_id)
    if db_node is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found",
        )

    db.query(models.Edge).filter(
        or_(
            models.Edge.from_node_id == node_id,
            models.Edge.to_node_id == node_id,
        )
    ).delete(synchronize_session=False)
    db.query(models.Kiosk).filter(models.Kiosk.node_id == node_id).update(
        {models.Kiosk.node_id: None},
        synchronize_session=False,
    )
    db.delete(db_node)
    db.commit()
    return None
