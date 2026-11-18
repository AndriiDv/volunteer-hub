import os
import uuid
import boto3
from botocore.exceptions import ClientError
from fastapi import HTTPException, UploadFile
from app.core.config import settings

def get_s3_client():
    kwargs = {"region_name": settings.AWS_DEFAULT_REGION}
    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
        kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY
    return boto3.client("s3", **kwargs)

async def upload_proof_image(file: UploadFile, fundraiser_id: int) -> str:
    # Validate extension
    filename = file.filename or "receipt.jpg"
    ext = os.path.splitext(filename)[1].lower()
    allowed_exts = {".jpg", ".jpeg", ".png", ".webp", ".pdf"}
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file format '{ext}'. Allowed: {', '.join(allowed_exts)}"
        )
    
    unique_name = f"proofs/{fundraiser_id}_{uuid.uuid4().hex[:8]}_{filename}"
    s3_client = get_s3_client()
    
    try:
        content_type = file.content_type or "application/octet-stream"
        file_bytes = await file.read()
        s3_client.put_object(
            Bucket=settings.S3_BUCKET_NAME,
            Key=unique_name,
            Body=file_bytes,
            ContentType=content_type,
        )
    except ClientError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload receipt to S3: {str(e)}"
        )
    
    # Construct public S3 URL
    public_url = f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_DEFAULT_REGION}.amazonaws.com/{unique_name}"
    return public_url
