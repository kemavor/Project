#!/usr/bin/env python3
"""
Create Course Documents Table for VisionWare
This script creates the missing course_documents table.
"""

from database import engine, Base
from models import CourseDocument
from sqlalchemy import inspect


def create_course_documents_table():
    """Create the course_documents table"""

    print("🔧 Creating Course Documents Table")
    print("=" * 40)

    try:
        # Check if table already exists
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        if 'course_documents' in tables:
            print("✅ course_documents table already exists")
            return True

        print("📋 Creating course_documents table...")

        # Create the table
        CourseDocument.__table__.create(bind=engine, checkfirst=True)

        print("✅ course_documents table created successfully")

        # Verify the table was created
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        if 'course_documents' in tables:
            print("✅ Table verification successful")

            # Show table structure
            columns = inspector.get_columns('course_documents')
            print(f"\n📋 Table structure ({len(columns)} columns):")
            for col in columns:
                print(f"   - {col['name']}: {col['type']}")

            return True
        else:
            print("❌ Table creation failed")
            return False

    except Exception as e:
        print(f"❌ Error creating table: {e}")
        return False


def main():
    """Main function"""
    try:
        success = create_course_documents_table()
        if success:
            print(f"\n🎉 Course documents table is ready!")
            print(f"💡 You can now test document uploads")
        else:
            print(f"\n❌ Failed to create table")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")


if __name__ == "__main__":
    main()
