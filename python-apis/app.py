from dotenv import load_dotenv # type: ignore
from fastapi import FastAPI, HTTPException
import boto3
import logging
from botocore.exceptions import ClientError
from botocore.config import Config
from pydantic import BaseModel
import uuid
from models import products
import os
from pymongo import MongoClient
from pymongo.server_api import ServerApi
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
from bson.errors import InvalidId
app=FastAPI()
app.add_middleware(CORSMiddleware,allow_origins=[
        "*"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],)

load_dotenv()
uri = os.getenv("MONGODB_URI")
# Create a new client and connect to the server
client = MongoClient(uri, server_api=ServerApi('1'))
# Send a ping to confirm a successful connection
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)
db = client["ecommerce"]


products_collection = db["products"]

# Generate a presigned URL for the S3 object
s3_client = boto3.client(
    's3',
    region_name=os.getenv("AWS_REGION"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY"),
    aws_secret_access_key=os.getenv("AWS_SECRET_KEY"),
    config=Config(
        signature_version='s3v4',
        s3={'addressing_style': 'virtual'},
    ),
)

BUCKET = os.getenv("AWS_S3_BUCKET_NAME")
#generate presigned url for validatng the s3 and get Url in which we have to upload photos 

class FileData(BaseModel):
    mime_type: str

async def create_presigned_url(
    bucket_name, object_name, image_mime_type,expiration=3600,
):
    """Generate a presigned URL to share an S3 object
    :param bucket_name: string
    :param object_name: string
    :param region_name: string
    :param expiration: Time in seconds for the presigned URL to remain valid
    :return: Presigned URL as string. If error, returns None.
    """
    try:
        response = s3_client.generate_presigned_url(
            'put_object',
            Params={'Bucket': bucket_name, 'Key': object_name,"ContentType": image_mime_type},
            ExpiresIn=expiration,
        )
    except ClientError as e:
        logging.error(e)
        return None

    # The response contains the presigned URL
    print("response",response)
    return response

@app.post('/get-presigned-uri')
async def generate_presigned_uri(data:FileData):
    """Generate and return a presigned S3 URL."""
    print("mime_type",data.mime_type)
    id = f"{str(uuid.uuid4())}.{data.mime_type.split('/')[1]}"
    uri= await create_presigned_url(bucket_name=BUCKET,object_name=id,image_mime_type=data.mime_type)
    print(uri)
    # now store in s3 with the url
    return {
        "file_name":id,
        "uri":uri
    }

#pppost request for uploading photos in binary or base64 
#nad store the name in db 
@app.post('/store-data')
def uploadFile(Product:products.Product):
    try:
        product_dict = Product.model_dump()
        print("modal dump",product_dict)
        upload_prod=products_collection.insert_one(product_dict)
        print(upload_prod)
        return {
            "success":True,
            "message":"Products uploaded",
            "id": str(upload_prod.inserted_id)
        }
    except Exception as e:
        print("e",e)
        return {
            "success":False,
            "message":e
        }


@app.get("/get-data")
def get_data():
    try:
        data=list(products_collection.find())
        print(data)
        for product in data:
            product["_id"] = str(product["_id"])
        return{
            "success":True,
            "data":data
        }
    except Exception as e:
        return {
            "success":False,
            "message":e
        }

@app.get('/products/{id}')
def get_product(id: str):
    try:
        product = products_collection.find_one({"_id": ObjectId(id)})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        product["_id"] = str(product["_id"])
        return {"success": True, "data": product}
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID")



@app.get('/download-image/{object_name}')
def create_presigned_url(object_name:str):
    try:
        response = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': BUCKET, 'Key': object_name},
            ExpiresIn=3600,
        )
    except ClientError as e:
        logging.error(e)
        return {
            "success":False,"message":e
        }

    # The response contains the presigned URL
    return {"success":True,"message":response}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    uvicorn.run(app, host="localhost", port=8000)