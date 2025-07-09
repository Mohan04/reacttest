from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class NetworkConfig(BaseModel):
    source_ip: str = Field(..., description="Source IP address")
    source_port: str = Field(..., description="Source port")
    destination_ip: str = Field(..., description="Destination IP address")
    destination_port: str = Field(..., description="Destination port")
    description: str = Field(..., description="Configuration description")
    user_id: Optional[str] = Field(None, description="User ID")
    user_email: Optional[str] = Field(None, description="User email")

class LambdaInvocationRequest(BaseModel):
    function_name: str = Field(..., description="AWS Lambda function name")
    payload: Dict[str, Any] = Field(..., description="Function payload")
    invocation_type: str = Field("RequestResponse", description="Invocation type")

class S3ListRequest(BaseModel):
    bucket_name: str = Field(..., description="S3 bucket name")
    prefix: Optional[str] = Field("", description="Object prefix")

class EC2ListRequest(BaseModel):
    filters: Optional[Dict[str, Any]] = Field(None, description="EC2 filters")

class CloudWatchMetricsRequest(BaseModel):
    namespace: str = Field(..., description="CloudWatch namespace")
    metric_name: str = Field(..., description="Metric name")
    dimensions: Optional[List[Dict[str, str]]] = Field(None, description="Metric dimensions")
    start_time: Optional[str] = Field(None, description="Start time (ISO format)")
    end_time: Optional[str] = Field(None, description="End time (ISO format)")

class ApiResponse(BaseModel):
    success: bool = Field(..., description="Request success status")
    message: str = Field(..., description="Response message")
    data: Optional[Dict[str, Any]] = Field(None, description="Response data")
    error: Optional[str] = Field(None, description="Error message")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")

class UserInfo(BaseModel):
    user_id: str = Field(..., description="User ID")
    email: str = Field(..., description="User email")
    name: Optional[str] = Field(None, description="User name")
    roles: List[str] = Field(default_factory=list, description="User roles")
    groups: List[str] = Field(default_factory=list, description="User groups")
    tenant_id: str = Field(..., description="Tenant ID")

class HealthCheckResponse(BaseModel):
    status: str = Field(..., description="Service status")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Check timestamp")
    aws_connected: bool = Field(..., description="AWS connection status")
    azure_configured: bool = Field(..., description="Azure AD configuration status") 