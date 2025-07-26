#!/usr/bin/env python3

from database import get_db
from models import User


def check_database_roles():
    # Get database session
    db = next(get_db())

    try:
        # Get all users
        users = db.query(User).all()

        print("=== Database User Roles ===")
        for user in users:
            print(f"Username: {user.username}")
            print(f"Role: {user.role}")
            print(f"Role type: {type(user.role)}")
            print(f"Is staff: {user.is_staff}")
            print(f"Is active: {user.is_active}")
            print("---")

    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    check_database_roles()
