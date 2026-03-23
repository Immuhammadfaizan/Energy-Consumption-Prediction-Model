from app import create_app, db
from sqlalchemy import text
import sys

def migrate():
    app = create_app()
    with app.app_context():
        try:
            # Check if column exists
            result = db.session.execute(text("SHOW COLUMNS FROM users LIKE 'profile_pic'"))
            if not result.fetchone():
                print("Adding profile_pic column to users table...")
                db.session.execute(text("ALTER TABLE users ADD COLUMN profile_pic VARCHAR(255) DEFAULT '/static/images/default-avatar.png'"))
                db.session.commit()
                print("Column added successfully.")
            else:
                print("profile_pic column already exists.")
        except Exception as e:
            print(f"Migration error: {e}")
            sys.exit(1)

if __name__ == "__main__":
    migrate()
