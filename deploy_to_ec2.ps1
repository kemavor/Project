#!/usr/bin/env pwsh

# VisionWare EC2 Deployment Script
param(
    [Parameter(Mandatory=$true)]
    [string]$EC2_IP,
    
    [Parameter(Mandatory=$false)]
    [string]$KeyPath = "ec2keypair.pem",
    
    [Parameter(Mandatory=$false)]
    [string]$Username = "ubuntu"
)

Write-Host "🚀 Starting VisionWare deployment to EC2..." -ForegroundColor Green
Write-Host "EC2 IP: $EC2_IP" -ForegroundColor Cyan
Write-Host "Key: $KeyPath" -ForegroundColor Cyan

# Check if key file exists
if (-not (Test-Path $KeyPath)) {
    Write-Host "❌ Error: Key file '$KeyPath' not found!" -ForegroundColor Red
    exit 1
}

# Set proper permissions for the key file (Windows equivalent)
Write-Host "🔐 Setting key file permissions..." -ForegroundColor Yellow

try {
    # Test SSH connection first
    Write-Host "🔍 Testing SSH connection..." -ForegroundColor Yellow
    ssh -i $KeyPath -o ConnectTimeout=10 -o StrictHostKeyChecking=no $Username@$EC2_IP "echo 'SSH connection successful'"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ SSH connection failed!" -ForegroundColor Red
        exit 1
    }

    # Create project directory on EC2
    Write-Host "📁 Creating project directory..." -ForegroundColor Yellow
    ssh -i $KeyPath $Username@$EC2_IP "mkdir -p ~/VisionWare"

    # Upload backend files
    Write-Host "📤 Uploading backend files..." -ForegroundColor Yellow
    scp -i $KeyPath -r backend/ $Username@${EC2_IP}:~/VisionWare/

    # Upload frontend files
    Write-Host "📤 Uploading frontend files..." -ForegroundColor Yellow
    scp -i $KeyPath -r src/ $Username@${EC2_IP}:~/VisionWare/
    scp -i $KeyPath package.json package-lock.json vite.config.ts tsconfig.json tailwind.config.js $Username@${EC2_IP}:~/VisionWare/

    # Upload configuration files
    Write-Host "📤 Uploading configuration files..." -ForegroundColor Yellow
    scp -i $KeyPath docker-compose.prod.yml Dockerfile.frontend requirements.txt $Username@${EC2_IP}:~/VisionWare/

    Write-Host "✅ Files uploaded successfully!" -ForegroundColor Green

    # Set up Python environment and install dependencies
    Write-Host "🐍 Setting up Python environment..." -ForegroundColor Yellow
    ssh -i $KeyPath $Username@$EC2_IP "cd ~/VisionWare && python3 -m pip install --user -r backend/requirements.txt"

    Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "  1. SSH into your instance: ssh -i $KeyPath $Username@$EC2_IP" -ForegroundColor White
    Write-Host "  2. Test S3 connection: cd ~/VisionWare/backend && python3 manage.py discover_s3_files" -ForegroundColor White
    Write-Host "  3. Start the application: python3 manage.py runserver 0.0.0.0:8000" -ForegroundColor White

} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} 