from pydantic import BaseModel
class Product(BaseModel):
    name: str
    descp: str
    price: float
    image_name: str