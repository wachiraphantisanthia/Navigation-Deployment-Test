from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..services.dijkstra import find_shortest_path


router = APIRouter(prefix="/route", tags=["route"])


@router.post("", response_model=schemas.RouteResponse)
def calculate_route(
    route_request: schemas.RouteRequest,
    db: Session = Depends(get_db),
):
    start_node_id = route_request.start_node_id
    if route_request.start_kiosk_id is not None:
        kiosk = db.get(models.Kiosk, route_request.start_kiosk_id)
        if kiosk is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Kiosk not found",
            )
        if not kiosk.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Kiosk is inactive",
            )
        if kiosk.node_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Kiosk is not linked to a navigation node",
            )
        start_node_id = kiosk.node_id

    if start_node_id is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="start_node_id or start_kiosk_id is required",
        )

    result = find_shortest_path(
        db=db,
        start_node_id=start_node_id,
        destination_node_id=route_request.destination_node_id,
        wheelchair_accessible=route_request.wheelchair_accessible,
    )

    nodes = db.query(models.Node).filter(models.Node.id.in_(result["path"])).all()
    nodes_by_id = {node.id: node for node in nodes}
    ordered_nodes = [nodes_by_id[node_id] for node_id in result["path"]]
    steps = [
        f"Move from {nodes_by_id[from_node_id].name} to {nodes_by_id[to_node_id].name}"
        for from_node_id, to_node_id in zip(result["path"], result["path"][1:])
    ]

    return {
        "path": result["path"],
        "distance": result["distance"],
        "steps": steps,
        "nodes": ordered_nodes,
    }
