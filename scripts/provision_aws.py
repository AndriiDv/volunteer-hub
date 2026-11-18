import os
import sys
import json
import time
import boto3
from botocore.exceptions import ClientError

def load_aws_env():
    env_file = ".env.aws"
    if not os.path.exists(env_file):
        raise FileNotFoundError(f"Missing {env_file} file.")
    with open(env_file, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                k, v = line.split("=", 1)
                os.environ[k.strip()] = v.strip()

def provision_s3(region: str, bucket_name: str):
    s3 = boto3.client("s3", region_name=region)
    print(f"[*] Checking/Creating S3 bucket '{bucket_name}' in '{region}'...")
    try:
        s3.head_bucket(Bucket=bucket_name)
        print(f"Bucket '{bucket_name}' already exists.")
    except ClientError:
        print(f"Creating bucket '{bucket_name}'...")
        s3.create_bucket(
            Bucket=bucket_name,
            CreateBucketConfiguration={"LocationConstraint": region}
        )
        print(f"Bucket '{bucket_name}' created successfully.")

    print("[*] Configuring Public Access Block...")
    s3.put_public_access_block(
        Bucket=bucket_name,
        PublicAccessBlockConfiguration={
            "BlockPublicAcls": False,
            "IgnorePublicAcls": False,
            "BlockPublicPolicy": False,
            "RestrictPublicBuckets": False,
        }
    )

    print("[*] Attaching bucket policy for public read on 'proofs/*'...")
    bucket_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "PublicReadForProofs",
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": f"arn:aws:s3:::{bucket_name}/proofs/*"
            }
        ]
    }
    s3.put_bucket_policy(Bucket=bucket_name, Policy=json.dumps(bucket_policy))

    print("[*] Configuring CORS on bucket...")
    cors_config = {
        "CORSRules": [
            {
                "AllowedHeaders": ["*"],
                "AllowedMethods": ["GET", "HEAD", "PUT", "POST"],
                "AllowedOrigins": ["*"],
                "ExposeHeaders": ["ETag"],
                "MaxAgeSeconds": 3000
            }
        ]
    }
    s3.put_bucket_cors(Bucket=bucket_name, CORSConfiguration=cors_config)
    print(f"Bucket '{bucket_name}' configured successfully.")

def provision_ec2(region: str):
    ec2 = boto3.client("ec2", region_name=region)
    key_name = "volunteer-hub-key"
    key_path = "volunteer-hub-key.pem"
    sg_name = "volunteer-hub-sg"

    print(f"[*] Checking/Creating EC2 Key Pair '{key_name}'...")
    existing_keys = [k["KeyName"] for k in ec2.describe_key_pairs().get("KeyPairs", [])]
    if key_name not in existing_keys:
        kp = ec2.create_key_pair(KeyName=key_name, KeyType="rsa", KeyFormat="pem")
        with open(key_path, "w") as f:
            f.write(kp["KeyMaterial"])
        print(f"Saved private key to {key_path}")
    else:
        print(f"Key pair '{key_name}' already exists in AWS.")
        if not os.path.exists(key_path):
            print(f"WARNING: Local file '{key_path}' does not exist! Recreating key pair...")
            ec2.delete_key_pair(KeyName=key_name)
            kp = ec2.create_key_pair(KeyName=key_name, KeyType="rsa", KeyFormat="pem")
            with open(key_path, "w") as f:
                f.write(kp["KeyMaterial"])
            print(f"Re-created and saved key to {key_path}")

    # Security Group
    print(f"[*] Checking/Creating Security Group '{sg_name}'...")
    sgs = ec2.describe_security_groups(
        Filters=[{"Name": "group-name", "Values": [sg_name]}]
    ).get("SecurityGroups", [])
    
    if sgs:
        sg_id = sgs[0]["GroupId"]
        print(f"Security Group '{sg_name}' exists (ID: {sg_id}).")
    else:
        vpcs = ec2.describe_vpcs(Filters=[{"Name": "isDefault", "Values": ["true"]}]).get("Vpcs", [])
        vpc_id = vpcs[0]["VpcId"] if vpcs else None
        create_args = {
            "GroupName": sg_name,
            "Description": "Security group for Volunteer Hub (SSH, HTTP, HTTPS)"
        }
        if vpc_id:
            create_args["VpcId"] = vpc_id
        sg_res = ec2.create_security_group(**create_args)
        sg_id = sg_res["GroupId"]
        print(f"Created Security Group '{sg_name}' (ID: {sg_id}).")

        # Add inbound rules
        ec2.authorize_security_group_ingress(
            GroupId=sg_id,
            IpPermissions=[
                {
                    "IpProtocol": "tcp",
                    "FromPort": 22,
                    "ToPort": 22,
                    "IpRanges": [{"CidrIp": "0.0.0.0/0", "Description": "SSH access"}],
                },
                {
                    "IpProtocol": "tcp",
                    "FromPort": 80,
                    "ToPort": 80,
                    "IpRanges": [{"CidrIp": "0.0.0.0/0", "Description": "HTTP access"}],
                },
                {
                    "IpProtocol": "tcp",
                    "FromPort": 443,
                    "ToPort": 443,
                    "IpRanges": [{"CidrIp": "0.0.0.0/0", "Description": "HTTPS access"}],
                },
            ],
        )
        print("Inbound rules (22, 80, 443) added.")

    # EC2 Instance
    print("[*] Finding Ubuntu 24.04 LTS AMI...")
    ssm = boto3.client("ssm", region_name=region)
    try:
        param = ssm.get_parameter(Name="/aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id")
        ami_id = param["Parameter"]["Value"]
    except Exception:
        ami_id = "ami-084df9e6ad4622caf"
    print(f"Using AMI: {ami_id}")

    # Check if instance already exists and is running/pending
    instances = ec2.describe_instances(
        Filters=[
            {"Name": "tag:Name", "Values": ["volunteer-hub-server"]},
            {"Name": "instance-state-name", "Values": ["pending", "running", "stopping", "stopped"]},
        ]
    )
    
    inst = None
    for r in instances.get("Reservations", []):
        for i in r.get("Instances", []):
            inst = i
            break
        if inst:
            break

    if inst:
        instance_id = inst["InstanceId"]
        state = inst["State"]["Name"]
        print(f"Found existing instance {instance_id} in state '{state}'.")
        if state == "stopped":
            print("Starting instance...")
            ec2.start_instances(InstanceIds=[instance_id])
    else:
        print("[*] Launching EC2 t3.micro instance with 20GB gp3...")
        run_res = ec2.run_instances(
            ImageId=ami_id,
            InstanceType="t3.micro",
            KeyName=key_name,
            SecurityGroupIds=[sg_id],
            MinCount=1,
            MaxCount=1,
            BlockDeviceMappings=[
                {
                    "DeviceName": "/dev/sda1",
                    "Ebs": {
                        "VolumeSize": 20,
                        "VolumeType": "gp3",
                        "DeleteOnTermination": True,
                    },
                }
            ],
            TagSpecifications=[
                {
                    "ResourceType": "instance",
                    "Tags": [
                        {"Key": "Name", "Value": "volunteer-hub-server"},
                        {"Key": "Project", "Value": "volunteer-hub"},
                    ],
                }
            ],
        )
        instance_id = run_res["Instances"][0]["InstanceId"]
        print(f"Launched instance {instance_id}")

    print(f"[*] Waiting for instance {instance_id} to be in running state...")
    waiter = ec2.get_waiter("instance_running")
    waiter.wait(InstanceIds=[instance_id])

    # Fetch public IP
    desc = ec2.describe_instances(InstanceIds=[instance_id])
    pub_ip = desc["Reservations"][0]["Instances"][0].get("PublicIpAddress")
    print(f"\n==========================================")
    print(f"EC2 Instance ID: {instance_id}")
    print(f"Public IPv4 Address: {pub_ip}")
    print(f"==========================================\n")
    return pub_ip

if __name__ == "__main__":
    load_aws_env()
    region = os.environ.get("AWS_DEFAULT_REGION", "eu-north-1")
    bucket = "volunteer-hub-media-andriidv"
    provision_s3(region, bucket)
    ip = provision_ec2(region)
    # Save IP to a local file for deployment convenience
    with open("instance_ip.txt", "w") as f:
        f.write(ip or "")
