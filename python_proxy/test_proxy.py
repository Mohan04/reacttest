#!/usr/bin/env python3
"""
Test script for the AWS Proxy API
This script tests the proxy endpoints without requiring a real Azure AD token
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
PROXY_BASE_URL = "http://localhost:8000"

def test_health_check():
    """Test the health check endpoint"""
    print("🔍 Testing Health Check...")
    try:
        response = requests.get(f"{PROXY_BASE_URL}/health", timeout=10)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("✅ Health Check Response:")
            print(json.dumps(data, indent=2))
            return True
        else:
            print(f"❌ Health check failed: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Health check error: {e}")
        return False

def test_network_config_without_token():
    """Test network config endpoint without token (should fail)"""
    print("\n🔍 Testing Network Config without Token...")
    try:
        payload = {
            "sourceIp": "192.168.1.1",
            "sourcePort": "80",
            "destinationIp": "10.0.0.1",
            "destinationPort": "443",
            "description": "Test configuration"
        }
        
        response = requests.post(
            f"{PROXY_BASE_URL}/api/network-config",
            json=payload,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        if response.status_code == 401:
            print("✅ Correctly rejected request without token")
            return True
        else:
            print(f"❌ Unexpected response: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}")
        return False

def test_lambda_invoke_without_token():
    """Test lambda invoke endpoint without token (should fail)"""
    print("\n🔍 Testing Lambda Invoke without Token...")
    try:
        payload = {
            "function_name": "test-function",
            "payload": {"test": "data"},
            "invocation_type": "RequestResponse"
        }
        
        response = requests.post(
            f"{PROXY_BASE_URL}/api/lambda/invoke",
            json=payload,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        if response.status_code == 401:
            print("✅ Correctly rejected request without token")
            return True
        else:
            print(f"❌ Unexpected response: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}")
        return False

def test_invalid_token():
    """Test with an invalid token (should fail)"""
    print("\n🔍 Testing with Invalid Token...")
    try:
        payload = {
            "sourceIp": "192.168.1.1",
            "sourcePort": "80",
            "destinationIp": "10.0.0.1",
            "destinationPort": "443",
            "description": "Test configuration"
        }
        
        headers = {
            "Authorization": "Bearer invalid_token_here",
            "Content-Type": "application/json"
        }
        
        response = requests.post(
            f"{PROXY_BASE_URL}/api/network-config",
            json=payload,
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        if response.status_code == 401:
            print("✅ Correctly rejected invalid token")
            return True
        else:
            print(f"❌ Unexpected response: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}")
        return False

def test_api_documentation():
    """Test if the API documentation is accessible"""
    print("\n🔍 Testing API Documentation...")
    try:
        response = requests.get(f"{PROXY_BASE_URL}/docs", timeout=10)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("✅ API documentation is accessible")
            return True
        else:
            print(f"❌ API documentation not accessible: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Documentation check error: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting AWS Proxy API Tests")
    print("=" * 50)
    print(f"Testing proxy at: {PROXY_BASE_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("=" * 50)
    
    tests = [
        ("Health Check", test_health_check),
        ("Network Config without Token", test_network_config_without_token),
        ("Lambda Invoke without Token", test_lambda_invoke_without_token),
        ("Invalid Token", test_invalid_token),
        ("API Documentation", test_api_documentation)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        if test_func():
            passed += 1
            print(f"✅ {test_name} PASSED")
        else:
            print(f"❌ {test_name} FAILED")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The proxy is working correctly.")
        return 0
    else:
        print("⚠️  Some tests failed. Check the proxy configuration.")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 