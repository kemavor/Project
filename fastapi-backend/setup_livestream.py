#!/usr/bin/env python3
"""
Script to set up livestream tables in the SQLite database
"""

import sqlite3
from datetime import datetime


def setup_livestream_tables():
    """Create livestream tables in the SQLite database"""
    conn = sqlite3.connect('visionware.db')
    cursor = conn.cursor()

    try:
        print("Creating livestream tables...")

        # Create live_streams table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS live_streams (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                course_id INTEGER NOT NULL,
                instructor_id INTEGER NOT NULL,
                status TEXT DEFAULT 'scheduled',
                stream_key TEXT UNIQUE,
                stream_url TEXT,
                viewer_count INTEGER DEFAULT 0,
                max_viewers INTEGER DEFAULT 100,
                scheduled_at TIMESTAMP,
                started_at TIMESTAMP,
                ended_at TIMESTAMP,
                duration INTEGER DEFAULT 0,
                quality_settings TEXT,
                is_public BOOLEAN DEFAULT 1,
                is_recording BOOLEAN DEFAULT 0,
                recording_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (course_id) REFERENCES courses (id),
                FOREIGN KEY (instructor_id) REFERENCES users (id)
            )
        ''')

        # Create stream_participants table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS stream_participants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                stream_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                left_at TIMESTAMP,
                duration_watched INTEGER DEFAULT 0,
                is_moderator BOOLEAN DEFAULT 0,
                can_chat BOOLEAN DEFAULT 1,
                can_ask_questions BOOLEAN DEFAULT 1,
                FOREIGN KEY (stream_id) REFERENCES live_streams (id),
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')

        # Create chat_messages table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chat_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                stream_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                message TEXT NOT NULL,
                message_type TEXT DEFAULT 'text',
                is_visible BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (stream_id) REFERENCES live_streams (id),
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')

        # Create questions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                stream_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                question TEXT NOT NULL,
                is_answered BOOLEAN DEFAULT 0,
                is_visible BOOLEAN DEFAULT 1,
                upvotes INTEGER DEFAULT 0,
                answered_at TIMESTAMP,
                answered_by INTEGER,
                answer TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (stream_id) REFERENCES live_streams (id),
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (answered_by) REFERENCES users (id)
            )
        ''')

        # Create stream_analytics table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS stream_analytics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                stream_id INTEGER NOT NULL,
                peak_viewers INTEGER DEFAULT 0,
                total_unique_viewers INTEGER DEFAULT 0,
                average_watch_time REAL DEFAULT 0.0,
                chat_messages_count INTEGER DEFAULT 0,
                questions_count INTEGER DEFAULT 0,
                engagement_score REAL DEFAULT 0.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (stream_id) REFERENCES live_streams (id)
            )
        ''')

        conn.commit()
        print("✅ Livestream tables created successfully!")

        # Verify tables exist
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('live_streams', 'stream_participants', 'chat_messages', 'questions', 'stream_analytics')")
        tables = [row[0] for row in cursor.fetchall()]
        print(f"📋 Created tables: {', '.join(tables)}")

    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

    return True


def add_sample_data():
    """Add sample livestream data for testing"""
    conn = sqlite3.connect('visionware.db')
    cursor = conn.cursor()

    try:
        print("Adding sample livestream data...")

        # Check if we have any users and courses
        cursor.execute("SELECT id, role FROM users LIMIT 1")
        user_result = cursor.fetchone()

        cursor.execute("SELECT id FROM courses LIMIT 1")
        course_result = cursor.fetchone()

        if not user_result or not course_result:
            print("⚠️  No users or courses found. Please create some first.")
            return False

        user_id, user_role = user_result
        course_id = course_result[0]

        # Only create sample if user is a teacher
        if user_role != "teacher":
            print("⚠️  No teacher found. Please create a teacher account first.")
            return False

        # Create sample live stream
        import uuid
        stream_key = str(uuid.uuid4())

        cursor.execute('''
            INSERT INTO live_streams (
                title, description, course_id, instructor_id, status, 
                stream_key, max_viewers, is_public, is_recording, 
                quality_settings, scheduled_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            "Introduction to Live Streaming",
            "Learn the basics of live streaming in education",
            course_id,
            user_id,
            "scheduled",
            stream_key,
            50,
            1,
            1,
            '{"resolution": "720p", "frameRate": 30, "bitrate": 2500}',
            datetime.utcnow().isoformat()
        ))

        stream_id = cursor.lastrowid
        conn.commit()

        print(f"✅ Created sample livestream: Introduction to Live Streaming")
        print(f"   Stream ID: {stream_id}")
        print(f"   Stream Key: {stream_key}")

    except Exception as e:
        print(f"❌ Error adding sample data: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

    return True


if __name__ == "__main__":
    print("🚀 Setting up livestream functionality...")

    # Create tables
    if setup_livestream_tables():
        # Add sample data
        add_sample_data()
        print("\n🎉 Livestream setup completed successfully!")
        print("\n📝 Next steps:")
        print("1. Start the backend server: python main.py")
        print("2. Test the livestream endpoints")
        print("3. Create a teacher account to start streaming")
    else:
        print("\n❌ Livestream setup failed!")
