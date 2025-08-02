import requests
import json


def get_stream_key():
    print("🔑 Getting Stream Key from VisionWare")
    print("=" * 40)

    # Backend URL
    BASE_URL = "http://localhost:8000"

    # You'll need to log in first and get a fresh token
    print("📋 Instructions:")
    print("1. Open VisionWare in your browser")
    print("2. Log in with your credentials")
    print("3. Go to 'Create Live Stream' page")
    print("4. Click 'Manage Streams' tab")
    print("5. Find your stream and click 'Copy Key' button")
    print("6. Use that stream key in OBS")

    print("\n🎥 OBS Configuration:")
    print("Service: Custom")
    print("Server: rtmp://localhost:1935/live")
    print("Stream Key: [Copy from VisionWare dashboard]")

    print("\n📋 Example Stream Key Format:")
    print("845a280d-c29b-4698-ad00-f1e5e7593a56")

    print("\n🔧 If you can't find your stream:")
    print("1. Create a new stream in VisionWare")
    print("2. Go to 'Manage Streams' tab")
    print("3. Copy the stream key")
    print("4. Configure OBS with that key")

    print("\n✅ Success Checklist:")
    print("- [ ] RTMP server running (port 1935)")
    print("- [ ] Stream created in VisionWare")
    print("- [ ] Stream key copied from dashboard")
    print("- [ ] OBS configured with correct settings")
    print("- [ ] OBS shows 'Live' status when streaming")


if __name__ == "__main__":
    get_stream_key()
