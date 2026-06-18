import zlib

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db


router = APIRouter(prefix="/kiosk", tags=["kiosk frontend"])

EXCLUDED_DESTINATION_TYPES = {"kiosk", "waypoint"}
BASE_CATEGORY_KEYS = {"waypoint", "entrance", "elevator", "escalator"}
FEATURED_DESTINATION_LIMIT = 12


@router.get(
    "/categories",
    response_model=list[schemas.KioskCategoryResponse],
    summary="Get visible kiosk destination categories",
)
def get_categories(db: Session = Depends(get_db)):
    categories = _visible_categories(db)
    return [_category_response(category) for category in categories]


@router.get(
    "/categories/{category_id}/destinations",
    response_model=list[schemas.KioskDestinationSummary],
    summary="Get visible destinations by category",
)
def get_destinations_by_category(
    category_id: int,
    db: Session = Depends(get_db),
):
    category = _category_by_public_id(db, category_id)
    return [
        _destination_summary(node)
        for node in _visible_destinations(db)
        .filter(models.Node.node_type == category.key)
        .order_by(models.Node.floor, models.Node.name)
        .all()
    ]


@router.get(
    "/destinations/{node_id}",
    response_model=schemas.KioskDestinationDetail,
    summary="Get visible destination detail",
)
def get_destination_detail(node_id: int, db: Session = Depends(get_db)):
    node = db.get(models.Node, node_id)
    if node is None or node.is_hidden or node.node_type in EXCLUDED_DESTINATION_TYPES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Destination not found",
        )

    category = _visible_category_by_key(db, node.node_type)
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Destination category not found",
        )

    return schemas.KioskDestinationDetail(
        **_destination_summary(node).model_dump(),
        description=node.description,
        environment_description=node.environment_description,
        category=_category_response(category),
    )


@router.get(
    "/search",
    response_model=list[schemas.KioskDestinationSummary],
    summary="Search visible destinations by node or category name",
)
def search_destinations(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
):
    query = q.strip()
    if not query:
        return []

    matching_category_keys = [
        category.key
        for category in _visible_categories(db)
        if query.lower() in category.label.lower()
    ]
    nodes = (
        _visible_destinations(db)
        .filter(
            or_(
                models.Node.name.ilike(f"%{query}%"),
                models.Node.node_type.in_(matching_category_keys),
            )
        )
        .order_by(models.Node.floor, models.Node.name)
        .all()
    )
    return [_destination_summary(node) for node in nodes]


@router.get(
    "/home",
    response_model=schemas.KioskHomeResponse,
    summary="Get kiosk home categories and featured destinations",
)
def get_home(db: Session = Depends(get_db)):
    categories = [_category_response(category) for category in _visible_categories(db)]
    featured_destinations = [
        _destination_summary(node)
        for node in _visible_destinations(db)
        .order_by(models.Node.floor, models.Node.name)
        .limit(FEATURED_DESTINATION_LIMIT)
        .all()
    ]
    return schemas.KioskHomeResponse(
        categories=categories,
        featured_destinations=featured_destinations,
    )


def _visible_categories(db: Session) -> list[models.NodeCategory]:
    return (
        db.query(models.NodeCategory)
        .filter(models.NodeCategory.is_hidden.is_(False))
        .filter(~models.NodeCategory.key.in_(EXCLUDED_DESTINATION_TYPES))
        .all()
    )
    return sorted(
        categories,
        key=lambda category: (
            0 if category.key in BASE_CATEGORY_KEYS else 1,
            category.label.lower(),
        ),
    )


def _visible_category_by_key(
    db: Session,
    category_key: str,
) -> models.NodeCategory | None:
    return (
        db.query(models.NodeCategory)
        .filter(models.NodeCategory.key == category_key)
        .filter(models.NodeCategory.is_hidden.is_(False))
        .first()
    )


def _category_by_public_id(
    db: Session,
    category_id: int,
) -> models.NodeCategory:
    for category in _visible_categories(db):
        if _category_public_id(category.key) == category_id:
            return category
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Category not found",
    )


def _visible_destinations(db: Session):
    return (
        db.query(models.Node)
        .filter(models.Node.is_hidden.is_(False))
        .filter(~models.Node.node_type.in_(EXCLUDED_DESTINATION_TYPES))
        .filter(
            models.Node.node_type.in_(
                db.query(models.NodeCategory.key).filter(
                    models.NodeCategory.is_hidden.is_(False)
                )
            )
        )
    )


def _category_response(
    category: models.NodeCategory,
) -> schemas.KioskCategoryResponse:
    return schemas.KioskCategoryResponse(
        id=_category_public_id(category.key),
        key=category.key,
        name=category.label,
        image_url=category.image_url,
        is_base=category.key in BASE_CATEGORY_KEYS,
    )


def _destination_summary(node: models.Node) -> schemas.KioskDestinationSummary:
    return schemas.KioskDestinationSummary(
        id=node.id,
        name=node.name,
        image_url=node.image_url,
        floor=node.floor,
    )


def _category_public_id(category_key: str) -> int:
    return zlib.crc32(category_key.encode("utf-8")) & 0x7FFFFFFF
