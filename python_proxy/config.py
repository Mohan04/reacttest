from pydantic_settings import BaseSettings
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # Azure AD Configuration
    azure_tenant_id: str = os.getenv("AZURE_TENANT_ID", "")
    azure_client_id: str = os.getenv("AZURE_CLIENT_ID", "")
    azure_client_secret: str = os.getenv("AZURE_CLIENT_SECRET", "")
    
    # AWS Configuration
    aws_access_key_id: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    aws_secret_access_key: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    aws_region: str = os.getenv("AWS_REGION", "us-east-1")
    aws_session_token: str = os.getenv("AWS_SESSION_TOKEN", "")
    
    # Proxy Configuration
    proxy_host: str = os.getenv("PROXY_HOST", "0.0.0.0")
    proxy_port: int = int(os.getenv("PROXY_PORT", "8000"))
    cors_origins: List[str] = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
    
    # JWT Configuration
    jwt_algorithms: List[str] = os.getenv("JWT_ALGORITHMS", "RS256").split(",")
    jwt_issuer: str = os.getenv("JWT_ISSUER", "")
    
    # Azure AD endpoints
    azure_discovery_url: str = f"https://login.microsoftonline.com/{azure_tenant_id}/discovery/v2.0/keys"
    
    class Config:
        env_file = ".env"

settings = Settings() 