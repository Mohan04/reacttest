from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import traceback
from typing import Optional

from config import settings
from auth import auth
from aws_client import aws_client
from models import (
    NetworkConfig, LambdaInvocationRequest, S3ListRequest, 
    EC2ListRequest, CloudWatchMetricsRequest, ApiResponse, 
    UserInfo, HealthCheckResponse
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="AWS Proxy API",
    description="Python proxy for validating Azure AD tokens and forwarding requests to AWS",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_current_user(authorization: Optional[str] = Header(None)) -> UserInfo:
    """Dependency to get current authenticated user"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        # Validate the token
        token_payload = auth.validate_token(token)
        
        # Extract user information
        user_info = auth.extract_user_info(token_payload)
        
        return UserInfo(**user_info)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token validation error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint"""
    try:
        # Test AWS connection
        aws_connected = False
        try:
            sts = aws_client.session.client('sts')
            sts.get_caller_identity()
            aws_connected = True
        except Exception as e:
            logger.warning(f"AWS connection test failed: {e}")
        
        # Check Azure configuration
        azure_configured = bool(
            settings.azure_tenant_id and 
            settings.azure_client_id and 
            settings.azure_client_secret
        )
        
        return HealthCheckResponse(
            status="healthy" if aws_connected and azure_configured else "degraded",
            aws_connected=aws_connected,
            azure_configured=azure_configured
        )
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthCheckResponse(
            status="unhealthy",
            aws_connected=False,
            azure_configured=False
        )

@app.post("/api/network-config", response_model=ApiResponse)
async def create_network_config(
    config: NetworkConfig,
    current_user: UserInfo = Depends(get_current_user)
):
    """Create network configuration"""
    try:
        # Add user context to the config
        config_dict = config.dict()
        config_dict['user_id'] = current_user.user_id
        config_dict['user_email'] = current_user.email
        
        # Forward to AWS
        result = aws_client.create_network_config(config_dict)
        
        return ApiResponse(
            success=True,
            message="Network configuration created successfully",
            data=result
        )
        
    except Exception as e:
        logger.error(f"Create network config failed: {e}")
        return ApiResponse(
            success=False,
            message="Failed to create network configuration",
            error=str(e)
        )

@app.post("/api/lambda/invoke", response_model=ApiResponse)
async def invoke_lambda_function(
    request: LambdaInvocationRequest,
    current_user: UserInfo = Depends(get_current_user)
):
    """Invoke AWS Lambda function"""
    try:
        # Add user context to the payload
        payload = request.payload.copy()
        payload['user_context'] = {
            'user_id': current_user.user_id,
            'email': current_user.email,
            'roles': current_user.roles
        }
        
        # Invoke Lambda function
        result = aws_client.invoke_lambda_function(
            function_name=request.function_name,
            payload=payload,
            invocation_type=request.invocation_type
        )
        
        return ApiResponse(
            success=True,
            message="Lambda function invoked successfully",
            data=result
        )
        
    except Exception as e:
        logger.error(f"Lambda invocation failed: {e}")
        return ApiResponse(
            success=False,
            message="Failed to invoke Lambda function",
            error=str(e)
        )

@app.get("/api/s3/buckets", response_model=ApiResponse)
async def list_s3_buckets(current_user: UserInfo = Depends(get_current_user)):
    """List S3 buckets"""
    try:
        result = aws_client.list_s3_buckets()
        
        return ApiResponse(
            success=True,
            message="S3 buckets retrieved successfully",
            data=result
        )
        
    except Exception as e:
        logger.error(f"S3 list buckets failed: {e}")
        return ApiResponse(
            success=False,
            message="Failed to list S3 buckets",
            error=str(e)
        )

@app.post("/api/s3/objects", response_model=ApiResponse)
async def list_s3_objects(
    request: S3ListRequest,
    current_user: UserInfo = Depends(get_current_user)
):
    """List objects in S3 bucket"""
    try:
        result = aws_client.list_s3_objects(
            bucket_name=request.bucket_name,
            prefix=request.prefix
        )
        
        return ApiResponse(
            success=True,
            message="S3 objects retrieved successfully",
            data=result
        )
        
    except Exception as e:
        logger.error(f"S3 list objects failed: {e}")
        return ApiResponse(
            success=False,
            message="Failed to list S3 objects",
            error=str(e)
        )

@app.post("/api/ec2/instances", response_model=ApiResponse)
async def list_ec2_instances(
    request: EC2ListRequest,
    current_user: UserInfo = Depends(get_current_user)
):
    """List EC2 instances"""
    try:
        result = aws_client.get_ec2_instances(filters=request.filters)
        
        return ApiResponse(
            success=True,
            message="EC2 instances retrieved successfully",
            data=result
        )
        
    except Exception as e:
        logger.error(f"EC2 list instances failed: {e}")
        return ApiResponse(
            success=False,
            message="Failed to list EC2 instances",
            error=str(e)
        )

@app.post("/api/cloudwatch/metrics", response_model=ApiResponse)
async def get_cloudwatch_metrics(
    request: CloudWatchMetricsRequest,
    current_user: UserInfo = Depends(get_current_user)
):
    """Get CloudWatch metrics"""
    try:
        result = aws_client.get_cloudwatch_metrics(
            namespace=request.namespace,
            metric_name=request.metric_name,
            dimensions=request.dimensions,
            start_time=request.start_time,
            end_time=request.end_time
        )
        
        return ApiResponse(
            success=True,
            message="CloudWatch metrics retrieved successfully",
            data=result
        )
        
    except Exception as e:
        logger.error(f"CloudWatch metrics failed: {e}")
        return ApiResponse(
            success=False,
            message="Failed to get CloudWatch metrics",
            error=str(e)
        )

@app.get("/api/user/profile", response_model=ApiResponse)
async def get_user_profile(current_user: UserInfo = Depends(get_current_user)):
    """Get current user profile"""
    return ApiResponse(
        success=True,
        message="User profile retrieved successfully",
        data=current_user.dict()
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}")
    logger.error(traceback.format_exc())
    
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "error": str(exc) if settings.proxy_host == "0.0.0.0" else "Internal server error"
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.proxy_host,
        port=settings.proxy_port,
        reload=True
    ) 