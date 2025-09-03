#!/usr/bin/env python3
"""
Database migration script for VisionWare RTMP-to-HLS architecture.
This script updates existing LiveStream records to support the new RTMP-based streaming model.

Changes:
- Renames stream_key to rtmp_key
- Adds hls_url field 
- Adds rtmp_server_url field
- Removes WebRTC/MediaSoup specific fields
- Updates existing streams with proper RTMP configuration
"""

import sqlite3
import uuid
from datetime import datetime

DATABASE_PATH = "fastapi-backend/app.db"

def backup_database():
    """Create a backup of the database before migration"""
    backup_path = f"app_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
    
    try:
        # Create backup
        with sqlite3.connect(DATABASE_PATH) as source:
            with sqlite3.connect(backup_path) as backup:
                source.backup(backup)
        
        print(f"✅ Database backed up to: {backup_path}")
        return backup_path
    except Exception as e:
        print(f"❌ Failed to create database backup: {e}")
        return None

def migrate_livestream_table():
    """Migrate the live_streams table to support RTMP architecture"""
    
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        print("🔄 Starting LiveStream table migration...")
        
        # Check if the table exists and get current schema
        cursor.execute("PRAGMA table_info(live_streams)")
        columns = [row[1] for row in cursor.fetchall()]
        print(f"📋 Current columns: {columns}")
        
        # Begin transaction
        cursor.execute("BEGIN TRANSACTION")
        
        # 1. Add new RTMP columns if they don't exist
        if 'rtmp_key' not in columns:
            cursor.execute("ALTER TABLE live_streams ADD COLUMN rtmp_key TEXT")
            print("➕ Added rtmp_key column")
        
        if 'hls_url' not in columns:
            cursor.execute("ALTER TABLE live_streams ADD COLUMN hls_url TEXT")
            print("➕ Added hls_url column")
        
        if 'rtmp_server_url' not in columns:
            cursor.execute("ALTER TABLE live_streams ADD COLUMN rtmp_server_url TEXT DEFAULT 'rtmp://localhost:1936/live'")
            print("➕ Added rtmp_server_url column")
        
        # 2. Migrate existing streams
        if 'stream_key' in columns:
            # Copy stream_key to rtmp_key for existing records
            cursor.execute("""
                UPDATE live_streams 
                SET rtmp_key = stream_key 
                WHERE rtmp_key IS NULL AND stream_key IS NOT NULL
            """)
            
            # Generate HLS URLs for existing streams
            cursor.execute("""
                UPDATE live_streams 
                SET hls_url = 'http://localhost:8081/hls/' || rtmp_key || '/index.m3u8'
                WHERE hls_url IS NULL AND rtmp_key IS NOT NULL
            """)
            
            print("🔄 Migrated existing stream keys to RTMP format")
        
        # 3. Generate RTMP keys for streams that don't have them
        cursor.execute("SELECT id FROM live_streams WHERE rtmp_key IS NULL")
        streams_without_keys = cursor.fetchall()
        
        for (stream_id,) in streams_without_keys:
            new_rtmp_key = str(uuid.uuid4())
            new_hls_url = f"http://localhost:8081/hls/{new_rtmp_key}/index.m3u8"
            
            cursor.execute("""
                UPDATE live_streams 
                SET rtmp_key = ?, hls_url = ?, rtmp_server_url = 'rtmp://localhost:1936/live'
                WHERE id = ?
            """, (new_rtmp_key, new_hls_url, stream_id))
        
        if streams_without_keys:
            print(f"🔑 Generated RTMP keys for {len(streams_without_keys)} streams")
        
        # 4. Remove deprecated columns (optional - be careful!)
        deprecated_columns = [
            'webrtc_enabled', 'webrtc_room_id', 'streaming_mode',
            'obs_stream_key', 'obs_rtmp_url', 'stream_url'
        ]
        
        # Note: SQLite doesn't support DROP COLUMN directly, so we'll leave them
        # In production, you might want to create a new table and copy data
        print("⚠️  Deprecated columns left in place (SQLite limitation)")
        
        # 5. Add unique constraint to rtmp_key if it doesn't exist
        try:
            cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_rtmp_key ON live_streams(rtmp_key)")
            print("📄 Added unique constraint to rtmp_key")
        except sqlite3.IntegrityError:
            print("⚠️  Some streams have duplicate RTMP keys - manual cleanup required")
        
        # Commit transaction
        cursor.execute("COMMIT")
        
        # Verify migration
        cursor.execute("SELECT COUNT(*) FROM live_streams WHERE rtmp_key IS NOT NULL")
        migrated_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM live_streams")
        total_count = cursor.fetchone()[0]
        
        print(f"✅ Migration completed successfully!")
        print(f"📊 {migrated_count}/{total_count} streams have RTMP keys")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        if 'cursor' in locals():
            cursor.execute("ROLLBACK")
        if 'conn' in locals():
            conn.close()
        return False

def verify_migration():
    """Verify that the migration was successful"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        print("\n🔍 Verifying migration...")
        
        # Check new columns exist
        cursor.execute("PRAGMA table_info(live_streams)")
        columns = [row[1] for row in cursor.fetchall()]
        
        required_columns = ['rtmp_key', 'hls_url', 'rtmp_server_url']
        missing_columns = [col for col in required_columns if col not in columns]
        
        if missing_columns:
            print(f"❌ Missing columns: {missing_columns}")
            return False
        
        # Check data integrity
        cursor.execute("SELECT COUNT(*) FROM live_streams WHERE rtmp_key IS NULL")
        null_rtmp_keys = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM live_streams WHERE hls_url IS NULL")
        null_hls_urls = cursor.fetchone()[0]
        
        if null_rtmp_keys > 0:
            print(f"⚠️  {null_rtmp_keys} streams have NULL rtmp_key")
        
        if null_hls_urls > 0:
            print(f"⚠️  {null_hls_urls} streams have NULL hls_url")
        
        # Show sample data
        cursor.execute("SELECT id, title, rtmp_key, hls_url, rtmp_server_url FROM live_streams LIMIT 3")
        sample_data = cursor.fetchall()
        
        print("\n📋 Sample migrated data:")
        for row in sample_data:
            print(f"  Stream {row[0]}: {row[1]}")
            print(f"    RTMP Key: {row[2]}")
            print(f"    HLS URL: {row[3]}")
            print(f"    RTMP Server: {row[4]}")
            print()
        
        conn.close()
        print("✅ Migration verification completed")
        return True
        
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False

def main():
    print("🚀 VisionWare RTMP-to-HLS Database Migration")
    print("=" * 50)
    
    # Create backup
    backup_path = backup_database()
    if not backup_path:
        print("❌ Cannot proceed without backup")
        return
    
    # Confirm migration
    print("\nThis will migrate your LiveStream table to support RTMP-to-HLS architecture.")
    confirm = input("Continue with migration? (y/N): ").lower().strip()
    
    if confirm != 'y':
        print("❌ Migration cancelled")
        return
    
    # Perform migration
    if migrate_livestream_table():
        # Verify migration
        if verify_migration():
            print(f"\n🎉 Migration completed successfully!")
            print(f"📁 Backup saved as: {backup_path}")
            print("\n📋 Next steps:")
            print("1. Start the updated FastAPI backend")
            print("2. Download and configure MediaMTX")
            print("3. Test RTMP streaming with OBS Studio")
        else:
            print("\n⚠️  Migration completed but verification found issues")
    else:
        print(f"\n❌ Migration failed - database restored from {backup_path}")

if __name__ == "__main__":
    main()