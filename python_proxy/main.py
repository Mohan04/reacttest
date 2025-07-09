from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import traceback
import httpx
from typing import Optional, Dict, Any

from config import settings
from auth import auth

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="AWS Gateway Proxy",
    description="Python proxy for validating Azure AD tokens and forwarding requests to AWS API Gateway",
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

async def validate_bearer_token(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Validate bearer token and return user info"""
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
        
        return user_info
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token validation error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")

async def forward_to_aws_gateway(request: Request, user_info: Dict[str, Any]) -> Dict[str, Any]:
    """Forward authenticated request to AWS API Gateway"""
    try:
        # Get the request method and path
        method = request.method
        path = request.url.path
        
        # Remove the /api prefix for AWS Gateway
        if path.startswith('/api'):
            aws_path = path[4:]  # Remove '/api'
        else:
            aws_path = path
        
        # Get request body if it's a POST/PUT request
        body = None
        if method in ['POST', 'PUT', 'PATCH']:
            try:
                body = await request.json()
            except:
                body = await request.body()
        
        # Get query parameters
        query_params = dict(request.query_params)
        
        # Prepare headers for AWS Gateway
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {settings.aws_api_key}',
            'X-User-ID': user_info['user_id'],
            'X-User-Email': user_info['email'],
            'X-User-Roles': ','.join(user_info.get('roles', [])),
            'X-User-Groups': ','.join(user_info.get('groups', [])),
            'X-Tenant-ID': user_info.get('tenant_id', ''),
        }
        
        # Add original headers that should be forwarded
        for header_name, header_value in request.headers.items():
            if header_name.lower() not in ['host', 'authorization', 'content-length']:
                headers[header_name] = header_value
        
        # Build AWS Gateway URL
        aws_gateway_url = f"{settings.aws_api_gateway_url}{aws_path}"
        
        # Add query parameters to URL
        if query_params:
            query_string = '&'.join([f"{k}={v}" for k, v in query_params.items()])
            aws_gateway_url += f"?{query_string}"
        
        logger.info(f"Forwarding {method} {path} to AWS Gateway: {aws_gateway_url}")
        logger.info(f"User: {user_info['email']}")
        
        # Make request to AWS Gateway
        async with httpx.AsyncClient(timeout=30.0) as client:
            if method == 'GET':
                response = await client.get(aws_gateway_url, headers=headers)
            elif method == 'POST':
                response = await client.post(aws_gateway_url, headers=headers, json=body)
            elif method == 'PUT':
                response = await client.put(aws_gateway_url, headers=headers, json=body)
            elif method == 'DELETE':
                response = await client.delete(aws_gateway_url, headers=headers)
            elif method == 'PATCH':
                response = await client.patch(aws_gateway_url, headers=headers, json=body)
            else:
                raise HTTPException(status_code=405, detail="Method not allowed")
            
            # Return the response from AWS Gateway
            response_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
            
            return {
                "success": response.status_code < 400,
                "status_code": response.status_code,
                "data": response_data,
                "user": user_info
            }
            
    except httpx.TimeoutException:
        logger.error("Timeout when forwarding request to AWS Gateway")
        raise HTTPException(status_code=504, detail="Gateway timeout")
    except httpx.RequestError as e:
        logger.error(f"Error forwarding request to AWS Gateway: {e}")
        raise HTTPException(status_code=502, detail="Bad gateway")
    except Exception as e:
        logger.error(f"Unexpected error forwarding request: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check Azure configuration
        azure_configured = bool(
            settings.azure_tenant_id and 
            settings.azure_client_id
        )
        
        # Check AWS Gateway configuration
        aws_gateway_configured = bool(settings.aws_api_gateway_url)
        
        return {
            "status": "healthy" if azure_configured and aws_gateway_configured else "degraded",
            "azure_configured": azure_configured,
            "aws_gateway_configured": aws_gateway_configured,
            "aws_gateway_url": settings.aws_api_gateway_url
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "azure_configured": False,
            "aws_gateway_configured": False
        }

@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_to_aws_gateway(
    request: Request,
    path: str,
    user_info: Dict[str, Any] = Depends(validate_bearer_token)
):
    """Proxy all API requests to AWS Gateway after token validation"""
    return await forward_to_aws_gateway(request, user_info)

@app.get("/api/user/profile")
async def get_user_profile(user_info: Dict[str, Any] = Depends(validate_bearer_token)):
    """Get current user profile - requires valid bearer token"""
    return {
        "success": True,
        "message": "User profile retrieved successfully",
        "data": user_info
    }

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
            "error": str(exc)
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.proxy_host,
        port=settings.proxy_port,
        log_level="info"
    ) 