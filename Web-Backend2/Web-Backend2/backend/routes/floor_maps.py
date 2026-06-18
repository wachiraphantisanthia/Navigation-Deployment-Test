from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db


router = APIRouter(prefix="/floor-maps", tags=["floor-maps"])


@router.get("", response_model=list[schemas.FloorMapResponse])
def get_floor_maps(db: Session = Depends(get_db)):
    return db.query(models.FloorMap).order_by(models.FloorMap.floor).all()


@router.put("/{floor}", response_model=schemas.FloorMapResponse)
def upsert_floor_map(
    floor: int,
    floor_map: schemas.FloorMapUpsert,
    db: Session = Depends(get_db),
):
    if floor != floor_map.floor:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Path floor and payload floor must match",
        )

    db_floor_map = db.get(models.FloorMap, floor)
    if db_floor_map is None:
        db_floor_map = models.FloorMap(**floor_map.model_dump())
        db.add(db_floor_map)
    else:
        for field, value in floor_map.model_dump().items():
            setattr(db_floor_map, field, value)

    db.commit()
    db.refresh(db_floor_map)
    return db_floor_map


@router.delete("/{floor}", status_code=status.HTTP_204_NO_CONTENT)
def delete_floor_map(floor: int, db: Session = Depends(get_db)):
    db_floor_map = db.get(models.FloorMap, floor)
    if db_floor_map is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Floor map not found",
        )

    db.delete(db_floor_map)
    db.commit()
    return None
