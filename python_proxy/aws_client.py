import boto3
import json
import logging
from typing import Dict, Any, Optional
from botocore.exceptions import ClientError, NoCredentialsError
from config import settings

logger = logging.getLogger(__name__)

class AWSClient:
    def __init__(self):
        self.region = settings.aws_region
        self.session = None
        self._initialize_session()

    def _initialize_session(self):
        """Initialize AWS session with credentials"""
        try:
            if settings.aws_session_token:
                # Use temporary credentials
                self.session = boto3.Session(
                    aws_access_key_id=settings.aws_access_key_id,
                    aws_secret_access_key=settings.aws_secret_access_key,
                    aws_session_token=settings.aws_session_token,
                    region_name=self.region
                )
            else:
                # Use permanent credentials
                self.session = boto3.Session(
                    aws_access_key_id=settings.aws_access_key_id,
                    aws_secret_access_key=settings.aws_secret_access_key,
                    region_name=self.region
                )
            
            # Test the session
            sts = self.session.client('sts')
            sts.get_caller_identity()
            logger.info("AWS session initialized successfully")
            
        except NoCredentialsError:
            logger.error("AWS credentials not found")
            raise
        except ClientError as e:
            logger.error(f"Failed to initialize AWS session: {e}")
            raise

    def get_lambda_client(self):
        """Get Lambda client"""
        return self.session.client('lambda')

    def get_s3_client(self):
        """Get S3 client"""
        return self.session.client('s3')

    def get_ec2_client(self):
        """Get EC2 client"""
        return self.session.client('ec2')

    def get_cloudwatch_client(self):
        """Get CloudWatch client"""
        return self.session.client('cloudwatch')

    def invoke_lambda_function(self, function_name: str, payload: Dict[str, Any], 
                             invocation_type: str = 'RequestResponse') -> Dict[str, Any]:
        """Invoke AWS Lambda function"""
        try:
            lambda_client = self.get_lambda_client()
            
            response = lambda_client.invoke(
                FunctionName=function_name,
                InvocationType=invocation_type,
                Payload=json.dumps(payload)
            )
            
            if invocation_type == 'RequestResponse':
                # Parse the response payload
                response_payload = json.loads(response['Payload'].read().decode('utf-8'))
                return {
                    'status_code': response['StatusCode'],
                    'payload': response_payload,
                    'headers': response.get('ResponseMetadata', {})
                }
            else:
                # For async invocations, return the request ID
                return {
                    'status_code': response['StatusCode'],
                    'request_id': response.get('ResponseMetadata', {}).get('RequestId'),
                    'headers': response.get('ResponseMetadata', {})
                }
                
        except ClientError as e:
            logger.error(f"Lambda invocation failed: {e}")
            raise

    def list_s3_buckets(self) -> Dict[str, Any]:
        """List S3 buckets"""
        try:
            s3_client = self.get_s3_client()
            response = s3_client.list_buckets()
            return {
                'buckets': [bucket['Name'] for bucket in response['Buckets']],
                'owner': response.get('Owner', {})
            }
        except ClientError as e:
            logger.error(f"S3 list buckets failed: {e}")
            raise

    def list_s3_objects(self, bucket_name: str, prefix: str = '') -> Dict[str, Any]:
        """List objects in S3 bucket"""
        try:
            s3_client = self.get_s3_client()
            response = s3_client.list_objects_v2(
                Bucket=bucket_name,
                Prefix=prefix
            )
            return {
                'objects': [obj['Key'] for obj in response.get('Contents', [])],
                'is_truncated': response.get('IsTruncated', False),
                'next_continuation_token': response.get('NextContinuationToken')
            }
        except ClientError as e:
            logger.error(f"S3 list objects failed: {e}")
            raise

    def get_ec2_instances(self, filters: Optional[Dict] = None) -> Dict[str, Any]:
        """Get EC2 instances"""
        try:
            ec2_client = self.get_ec2_client()
            
            if filters:
                response = ec2_client.describe_instances(Filters=filters)
            else:
                response = ec2_client.describe_instances()
            
            instances = []
            for reservation in response['Reservations']:
                for instance in reservation['Instances']:
                    instances.append({
                        'instance_id': instance['InstanceId'],
                        'instance_type': instance['InstanceType'],
                        'state': instance['State']['Name'],
                        'launch_time': instance['LaunchTime'].isoformat(),
                        'public_ip': instance.get('PublicIpAddress'),
                        'private_ip': instance.get('PrivateIpAddress'),
                        'tags': {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}
                    })
            
            return {'instances': instances}
            
        except ClientError as e:
            logger.error(f"EC2 describe instances failed: {e}")
            raise

    def get_cloudwatch_metrics(self, namespace: str, metric_name: str, 
                             dimensions: Optional[list] = None, 
                             start_time: Optional[str] = None,
                             end_time: Optional[str] = None) -> Dict[str, Any]:
        """Get CloudWatch metrics"""
        try:
            cloudwatch_client = self.get_cloudwatch_client()
            
            params = {
                'Namespace': namespace,
                'MetricName': metric_name,
                'Period': 300,  # 5 minutes
                'Statistics': ['Average', 'Maximum', 'Minimum']
            }
            
            if dimensions:
                params['Dimensions'] = dimensions
            
            if start_time:
                params['StartTime'] = start_time
            
            if end_time:
                params['EndTime'] = end_time
            
            response = cloudwatch_client.get_metric_statistics(**params)
            
            return {
                'datapoints': [
                    {
                        'timestamp': dp['Timestamp'].isoformat(),
                        'average': dp.get('Average'),
                        'maximum': dp.get('Maximum'),
                        'minimum': dp.get('Minimum')
                    }
                    for dp in response['Datapoints']
                ],
                'label': response.get('Label')
            }
            
        except ClientError as e:
            logger.error(f"CloudWatch get metrics failed: {e}")
            raise

    def create_network_config(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Create network configuration (example implementation)"""
        try:
            # This is an example implementation
            # In a real scenario, you might:
            # 1. Store configuration in DynamoDB
            # 2. Trigger Lambda functions
            # 3. Create CloudFormation stacks
            # 4. Update security groups
            
            # For now, we'll just return a mock response
            return {
                'config_id': f"config_{hash(str(config))}",
                'status': 'created',
                'config': config,
                'timestamp': '2024-01-01T00:00:00Z'
            }
            
        except Exception as e:
            logger.error(f"Create network config failed: {e}")
            raise

# Global AWS client instance
aws_client = AWSClient() 