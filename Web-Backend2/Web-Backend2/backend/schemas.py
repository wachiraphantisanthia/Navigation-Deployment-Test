from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class NodeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    node_type: str = Field(..., min_length=1, max_length=100)
    floor: int
    x: float
    y: float
    description: str | None = None
    environment_description: str | None = None
    image_description: str | None = None
    image_url: str | None = None
    kiosk_code: str | None = None
    service_floor_from: int | None = None
    service_floor_to: int | None = None
    use_when_floor_distance: int | None = None
    supports_wheelchair: bool = False


class NodeCreate(NodeBase):
    is_hidden: bool = False


class NodeUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    node_type: str | None = Field(default=None, min_length=1, max_length=100)
    floor: int | None = None
    x: float | None = None
    y: float | None = None
    description: str | None = None
    environment_description: str | None = None
    image_description: str | None = None
    image_url: str | None = None
    kiosk_code: str | None = None
    service_floor_from: int | None = None
    service_floor_to: int | None = None
    use_when_floor_distance: int | None = None
    supports_wheelchair: bool | None = None
    is_hidden: bool | None = None


class NodeResponse(NodeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_hidden: bool
    created_at: datetime
    updated_at: datetime


class EdgeCreate(BaseModel):
    from_node_id: int
    to_node_id: int
    weight: float = Field(..., gt=0)
    is_bidirectional: bool = True
    is_hidden: bool = False


class EdgeUpdate(BaseModel):
    from_node_id: int | None = None
    to_node_id: int | None = None
    weight: float | None = Field(default=None, gt=0)
    is_bidirectional: bool | None = None
    is_hidden: bool | None = None


class EdgeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    from_node_id: int
    to_node_id: int
    weight: float
    is_bidirectional: bool
    is_hidden: bool
    created_at: datetime


class FloorMapBase(BaseModel):
    floor: int
    image_data_url: str = Field(..., min_length=1)
    original_width: float = Field(..., gt=0)
    original_height: float = Field(..., gt=0)
    map_width: float = Field(..., gt=0)
    map_height: float = Field(..., gt=0)


class FloorMapUpsert(FloorMapBase):
    pass


class FloorMapResponse(FloorMapBase):
    model_config = ConfigDict(from_attributes=True)

    updated_at: datetime


class NodeCategoryBase(BaseModel):
    key: str = Field(..., min_length=1, max_length=100)
    label: str = Field(..., min_length=1, max_length=255)
    image_url: str | None = None
    is_hidden: bool = False


class NodeCategoryCreate(NodeCategoryBase):
    pass


class NodeCategoryUpdate(BaseModel):
    label: str | None = Field(default=None, min_length=1, max_length=255)
    image_url: str | None = None
    is_hidden: bool | None = None


class NodeCategoryResponse(NodeCategoryBase):
    model_config = ConfigDict(from_attributes=True)

    created_at: datetime


class KioskCategoryResponse(BaseModel):
    id: int
    key: str
    name: str
    image_url: str | None = None
    is_base: bool = False


class KioskDestinationSummary(BaseModel):
    id: int
    name: str
    image_url: str | None = None
    floor: int


class KioskDestinationDetail(KioskDestinationSummary):
    description: str | None = None
    environment_description: str | None = None
    category: KioskCategoryResponse


class KioskHomeResponse(BaseModel):
    categories: list[KioskCategoryResponse]
    featured_destinations: list[KioskDestinationSummary]


class KioskBase(BaseModel):
    kiosk_code: str = Field(..., min_length=1, max_length=100)
    name: str | None = None
    floor: int
    x: float
    y: float
    node_id: int | None = None
    is_active: bool = True


class KioskCreate(KioskBase):
    create_node: bool = False


class KioskUpdate(BaseModel):
    kiosk_code: str | None = Field(default=None, min_length=1, max_length=100)
    name: str | None = None
    floor: int | None = None
    x: float | None = None
    y: float | None = None
    node_id: int | None = None
    is_active: bool | None = None
    create_node: bool = False


class KioskResponse(KioskBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class RouteRequest(BaseModel):
    start_node_id: int | None = None
    start_kiosk_id: int | None = None
    destination_node_id: int
    wheelchair_accessible: bool = False


class RouteResponse(BaseModel):
    path: list[int]
    distance: float
    steps: list[str]
    nodes: list[NodeResponse]
