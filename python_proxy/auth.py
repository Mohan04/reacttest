import jwt
import requests
from typing import Dict, Optional
from fastapi import HTTPException, status
from config import settings
import json
from datetime import datetime, timezone

class AzureADAuth:
    def __init__(self):
        self.tenant_id = settings.azure_tenant_id
        self.client_id = settings.azure_client_id
        self.discovery_url = settings.azure_discovery_url
        self.jwt_issuer = settings.jwt_issuer
        self.jwt_algorithms = settings.jwt_algorithms
        self._public_keys = None
        self._last_key_fetch = None
        self._key_cache_duration = 3600  # 1 hour cache

    def _fetch_public_keys(self) -> Dict:
        """Fetch public keys from Azure AD discovery endpoint"""
        try:
            response = requests.get(self.discovery_url, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Failed to fetch Azure AD public keys: {str(e)}"
            )

    def _get_public_keys(self) -> Dict:
        """Get public keys with caching"""
        current_time = datetime.now(timezone.utc)
        
        if (self._public_keys is None or 
            self._last_key_fetch is None or 
            (current_time - self._last_key_fetch).total_seconds() > self._key_cache_duration):
            
            self._public_keys = self._fetch_public_keys()
            self._last_key_fetch = current_time
        
        return self._public_keys

    def _get_key_by_kid(self, kid: str) -> Optional[str]:
        """Get public key by key ID"""
        keys_data = self._get_public_keys()
        
        for key in keys_data.get('keys', []):
            if key.get('kid') == kid:
                # Convert JWK to PEM format
                return self._jwk_to_pem(key)
        
        return None

    def _jwk_to_pem(self, jwk: Dict) -> str:
        """Convert JWK to PEM format (simplified version)"""
        # This is a simplified conversion. In production, you might want to use
        # a library like `cryptography` for proper JWK to PEM conversion
        import base64
        
        n = base64.urlsafe_b64decode(jwk['n'] + '==')
        e = base64.urlsafe_b64decode(jwk['e'] + '==')
        
        # Create RSA public key in PEM format
        from cryptography.hazmat.primitives.asymmetric import rsa
        from cryptography.hazmat.primitives import serialization
        
        public_numbers = rsa.RSAPublicNumbers(
            e=int.from_bytes(e, 'big'),
            n=int.from_bytes(n, 'big')
        )
        public_key = public_numbers.public_key()
        
        pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        
        return pem.decode('utf-8')

    def validate_token(self, token: str) -> Dict:
        """Validate Azure AD JWT token"""
        try:
            # Decode token header to get key ID
            header = jwt.get_unverified_header(token)
            kid = header.get('kid')
            
            if not kid:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token: missing key ID"
                )
            
            # Get the public key
            public_key = self._get_key_by_kid(kid)
            if not public_key:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token: public key not found"
                )
            
            # Verify and decode the token
            payload = jwt.decode(
                token,
                public_key,
                algorithms=self.jwt_algorithms,
                audience=self.client_id,
                issuer=self.jwt_issuer,
                options={
                    "verify_signature": True,
                    "verify_aud": True,
                    "verify_iss": True,
                    "verify_exp": True,
                    "verify_nbf": True
                }
            )
            
            return payload
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.InvalidTokenError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Token validation error: {str(e)}"
            )

    def extract_user_info(self, token_payload: Dict) -> Dict:
        """Extract user information from token payload"""
        return {
            "user_id": token_payload.get("oid") or token_payload.get("sub"),
            "email": token_payload.get("preferred_username") or token_payload.get("email"),
            "name": token_payload.get("name"),
            "roles": token_payload.get("roles", []),
            "groups": token_payload.get("groups", []),
            "tenant_id": token_payload.get("tid")
        }

# Global auth instance
auth = AzureADAuth() 