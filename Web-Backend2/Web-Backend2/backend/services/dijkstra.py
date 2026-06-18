import heapq
from collections import defaultdict

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from .. import models


def find_shortest_path(
    db: Session,
    start_node_id: int,
    destination_node_id: int,
    wheelchair_accessible: bool = False,
) -> dict:
    if start_node_id == destination_node_id:
        node = db.get(models.Node, start_node_id)
        if node is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Start node not found",
            )
        if node.is_hidden:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Start or destination node is hidden",
            )
        return {"path": [start_node_id], "distance": 0.0}

    start_node = db.get(models.Node, start_node_id)
    destination_node = db.get(models.Node, destination_node_id)
    if start_node is None or destination_node is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Start or destination node not found",
        )
    if start_node.is_hidden or destination_node.is_hidden:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start or destination node is hidden",
        )

    available_nodes = db.query(models.Node).filter(models.Node.is_hidden.is_(False)).all()
    available_node_ids = {node.id for node in available_nodes}
    if wheelchair_accessible:
        available_node_ids = {
            node.id
            for node in available_nodes
            if node.node_type != "escalator" or node.supports_wheelchair
        }

    edges = db.query(models.Edge).filter(models.Edge.is_hidden.is_(False)).all()
    adjacency: dict[int, list[tuple[int, float]]] = defaultdict(list)

    for edge in edges:
        if (
            edge.from_node_id not in available_node_ids
            or edge.to_node_id not in available_node_ids
        ):
            continue
        adjacency[edge.from_node_id].append((edge.to_node_id, edge.weight))
        if edge.is_bidirectional:
            adjacency[edge.to_node_id].append((edge.from_node_id, edge.weight))

    distances = {start_node_id: 0.0}
    previous: dict[int, int] = {}
    priority_queue = [(0.0, start_node_id)]
    visited: set[int] = set()

    while priority_queue:
        current_distance, current_node_id = heapq.heappop(priority_queue)
        if current_node_id in visited:
            continue

        visited.add(current_node_id)
        if current_node_id == destination_node_id:
            break

        for neighbor_id, weight in adjacency[current_node_id]:
            if neighbor_id in visited:
                continue

            new_distance = current_distance + weight
            if new_distance < distances.get(neighbor_id, float("inf")):
                distances[neighbor_id] = new_distance
                previous[neighbor_id] = current_node_id
                heapq.heappush(priority_queue, (new_distance, neighbor_id))

    if destination_node_id not in distances:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No route found between the selected nodes",
        )

    path = []
    current_node_id = destination_node_id
    while current_node_id != start_node_id:
        path.append(current_node_id)
        current_node_id = previous[current_node_id]
    path.append(start_node_id)
    path.reverse()

    return {
        "path": path,
        "distance": round(distances[destination_node_id], 2),
    }
