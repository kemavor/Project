#!/bin/bash

echo "Starting MediaMTX for VisionWare RTMP-to-HLS streaming..."
echo

# Check if mediamtx exists
if [ ! -f "mediamtx" ]; then
    echo "ERROR: mediamtx binary not found in current directory."
    echo "Please download MediaMTX from: https://github.com/bluenviron/mediamtx/releases"
    echo "Extract it to this directory and try again."
    exit 1
fi

# Check if config exists
if [ ! -f "mediamtx.yml" ]; then
    echo "ERROR: mediamtx.yml configuration file not found."
    echo "This file should be in the same directory as mediamtx binary"
    exit 1
fi

# Make sure it's executable
chmod +x mediamtx

echo "Configuration found: mediamtx.yml"
echo "Starting MediaMTX server..."
echo
echo "RTMP Server: rtmp://localhost:1936/live"
echo "HLS Server: http://localhost:8081"
echo "API: http://localhost:9997"
echo
echo "Press Ctrl+C to stop the server"
echo

# Start MediaMTX
./mediamtx