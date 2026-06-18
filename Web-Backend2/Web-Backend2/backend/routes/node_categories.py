from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db


router = APIRouter(prefix="/node-categories", tags=["node-categories"])

DEFAULT_CATEGORIES = [
    ("waypoint", "Waypoint"),
    ("shop", "Shop"),
    ("toilet", "Toilet"),
    ("elevator", "Elevator"),
    ("escalator", "Escalator"),
    ("entrance", "Entrance"),
    ("information", "Information"),
    ("kiosk", "Kiosk"),
]

BASE_CATEGORY_KEYS = {"waypoint", "entrance", "elevator", "escalator"}


@router.get("", response_model=list[schemas.NodeCategoryResponse])
def get_node_categories(db: Session = Depends(get_db)):
    _seed_default_categories(db)
    return db.query(models.NodeCategory).order_by(models.NodeCategory.label).all()


@router.post(
    "",
    response_model=schemas.NodeCategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_node_category(
    category: schemas.NodeCategoryCreate,
    db: Session = Depends(get_db),
):
    existing = db.get(models.NodeCategory, category.key)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Node category already exists",
        )
    db_category = models.NodeCategory(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


@router.put("/{category_key}", response_model=schemas.NodeCategoryResponse)
def update_node_category(
    category_key: str,
    category_update: schemas.NodeCategoryUpdate,
    db: Session = Depends(get_db),
):
    db_category = db.get(models.NodeCategory, category_key)
    if db_category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node category not found",
        )
    for field, value in category_update.model_dump(exclude_unset=True).items():
        setattr(db_category, field, value)
    db.commit()
    db.refresh(db_category)
    return db_category


@router.delete("/{category_key}", status_code=status.HTTP_204_NO_CONTENT)
def delete_node_category(category_key: str, db: Session = Depends(get_db)):
    db_category = db.get(models.NodeCategory, category_key)
    if db_category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node category not found",
        )
    if category_key in BASE_CATEGORY_KEYS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Base category cannot be deleted",
        )

    db.query(models.Node).filter(models.Node.node_type == category_key).update(
        {models.Node.node_type: "waypoint"},
        synchronize_session=False,
    )
    db.delete(db_category)
    db.commit()
    return None


def _seed_default_categories(db: Session) -> None:
    existing_keys = {
        key for (key,) in db.query(models.NodeCategory.key).all()
    }
    for key, label in DEFAULT_CATEGORIES:
        if key in existing_keys:
            continue
        db.add(models.NodeCategory(key=key, label=label))
    db.commit()
