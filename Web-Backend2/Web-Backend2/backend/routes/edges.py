from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db


router = APIRouter(prefix="/edges", tags=["edges"])


@router.post(
    "",
    response_model=schemas.EdgeResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_edge(edge: schemas.EdgeCreate, db: Session = Depends(get_db)):
    if edge.from_node_id == edge.to_node_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot connect a node to itself",
        )

    from_node = db.get(models.Node, edge.from_node_id)
    to_node = db.get(models.Node, edge.to_node_id)
    if from_node is None or to_node is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or both nodes were not found",
        )

    db_edge = models.Edge(**edge.model_dump())
    db.add(db_edge)
    db.commit()
    db.refresh(db_edge)
    return db_edge


@router.get("", response_model=list[schemas.EdgeResponse])
def get_edges(db: Session = Depends(get_db)):
    return db.query(models.Edge).order_by(models.Edge.id).all()


@router.put("/{edge_id}", response_model=schemas.EdgeResponse)
def update_edge(
    edge_id: int,
    edge_update: schemas.EdgeUpdate,
    db: Session = Depends(get_db),
):
    db_edge = db.get(models.Edge, edge_id)
    if db_edge is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Edge not found",
        )

    update_data = edge_update.model_dump(exclude_unset=True)
    next_from_node_id = update_data.get("from_node_id", db_edge.from_node_id)
    next_to_node_id = update_data.get("to_node_id", db_edge.to_node_id)
    if next_from_node_id == next_to_node_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot connect a node to itself",
        )
    if "from_node_id" in update_data and db.get(models.Node, next_from_node_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="from_node_id was not found",
        )
    if "to_node_id" in update_data and db.get(models.Node, next_to_node_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="to_node_id was not found",
        )

    for field, value in update_data.items():
        setattr(db_edge, field, value)

    db.commit()
    db.refresh(db_edge)
    return db_edge


@router.delete("/{edge_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_edge(edge_id: int, db: Session = Depends(get_db)):
    db_edge = db.get(models.Edge, edge_id)
    if db_edge is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Edge not found",
        )

    db.delete(db_edge)
    db.commit()
    return None
