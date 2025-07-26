#!/usr/bin/env python3
"""
Configure AWS Access Keys for VisionWare
This script helps you add AWS access keys to your .env file.
"""

import os
import getpass

def configure_aws_keys():
    """Configure AWS access keys in .env file"""
    
    print("🔑 Configuring AWS Access Keys for Local Development")
    print("=" * 55)
    print("⚠️  Remember: Access keys are for local development only!")
    print("   For production, use IAM roles on EC2 instances.\n")
    
    # Get AWS access keys
    access_key = input("Enter your AWS Access Key ID: ").strip()
    if not access_key:
        print("❌ Access Key ID is required")
        return False
    
    secret_key = getpass.getpass("Enter your AWS Secret Access Key: ").strip()
    if not secret_key:
        print("❌ Secret Access Key is required")
        return False
    
    # Read current .env file
    env_file = ".env"
    lines = []
    
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            lines = f.readlines()
    
    # Update or add AWS keys
    updated_lines = []
    aws_key_added = False
    aws_secret_added = False
    
    for line in lines:
        line = line.strip()
        if line.startswith("AWS_ACCESS_KEY_ID="):
            updated_lines.append(f"AWS_ACCESS_KEY_ID={access_key}\n")
            aws_key_added = True
        elif line.startswith("AWS_SECRET_ACCESS_KEY="):
            updated_lines.append(f"AWS_SECRET_ACCESS_KEY={secret_key}\n")
            aws_secret_added = True
        else:
            updated_lines.append(line + "\n")
    
    # Add missing keys
    if not aws_key_added:
        updated_lines.append(f"AWS_ACCESS_KEY_ID={access_key}\n")
    if not aws_secret_added:
        updated_lines.append(f"AWS_SECRET_ACCESS_KEY={secret_key}\n")
    
    # Write updated .env file
    try:
        with open(env_file, 'w') as f:
            f.writelines(updated_lines)
        
        print("\n✅ AWS access keys configured successfully!")
        print(f"📁 Updated: {os.path.abspath(env_file)}")
        
        # Show current configuration (without showing the secret)
        print("\n📋 Current Configuration:")
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line.startswith("AWS_SECRET_ACCESS_KEY="):
                    print("   AWS_SECRET_ACCESS_KEY=***hidden***")
                else:
                    print(f"   {line}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error updating .env file: {e}")
        return False

def main():
    """Main function"""
    try:
        success = configure_aws_keys()
        if success:
            print("\n🎉 Ready to test AWS configuration!")
            print("💡 Run: python test_aws_config.py")
        else:
            print("\n❌ Configuration failed")
    except KeyboardInterrupt:
        print("\n\n❌ Configuration cancelled by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")

if __name__ == "__main__":
    main() 