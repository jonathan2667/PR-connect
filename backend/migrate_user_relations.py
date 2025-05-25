"""
Migration script to add user relationships to existing tables
This adds user_id foreign keys to Request and Transcript tables
"""

import os
from flask import Flask
from models import db, Request, Transcript, User
from sqlalchemy import text

def migrate_user_relations():
    """Add user_id columns to Request and Transcript tables"""
    app = Flask(__name__)
    
    # Database configuration
    DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://username:password@localhost/prconnect')
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    
    with app.app_context():
        try:
            print("🔄 Starting user relations migration...")
            
            # Check if user_id columns already exist
            result = db.session.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='requests' AND column_name='user_id'
            """))
            requests_has_user_id = result.fetchone() is not None
            
            result = db.session.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='transcripts' AND column_name='user_id'
            """))
            transcripts_has_user_id = result.fetchone() is not None
            
            changes_made = []
            
            # Add user_id to requests table if it doesn't exist
            if not requests_has_user_id:
                print("📝 Adding user_id column to requests table...")
                db.session.execute(text("""
                    ALTER TABLE requests 
                    ADD COLUMN user_id INTEGER REFERENCES users(id)
                """))
                changes_made.append("Added user_id to requests table")
                print("✅ user_id column added to requests table")
            else:
                print("✅ user_id column already exists in requests table")
            
            # Add user_id to transcripts table if it doesn't exist
            if not transcripts_has_user_id:
                print("📝 Adding user_id column to transcripts table...")
                db.session.execute(text("""
                    ALTER TABLE transcripts 
                    ADD COLUMN user_id INTEGER REFERENCES users(id)
                """))
                changes_made.append("Added user_id to transcripts table")
                print("✅ user_id column added to transcripts table")
            else:
                print("✅ user_id column already exists in transcripts table")
            
            # Commit the schema changes
            db.session.commit()
            
            # Get first user to assign existing data to (if any)
            first_user = User.query.first()
            if first_user and changes_made:
                print(f"👤 Assigning existing data to first user: {first_user.email}")
                
                # Update existing requests without user_id
                if not requests_has_user_id:
                    orphaned_requests = db.session.execute(text("""
                        UPDATE requests SET user_id = :user_id WHERE user_id IS NULL
                    """), {"user_id": first_user.id})
                    print(f"📋 Updated {orphaned_requests.rowcount} orphaned requests")
                
                # Update existing transcripts without user_id
                if not transcripts_has_user_id:
                    orphaned_transcripts = db.session.execute(text("""
                        UPDATE transcripts SET user_id = :user_id WHERE user_id IS NULL
                    """), {"user_id": first_user.id})
                    print(f"📝 Updated {orphaned_transcripts.rowcount} orphaned transcripts")
                
                db.session.commit()
            elif not first_user:
                print("⚠️ No users found - existing data will remain unassigned")
            
            if changes_made:
                print(f"✅ Migration completed successfully!")
                print(f"📊 Changes made: {', '.join(changes_made)}")
            else:
                print("✅ No migration needed - user relations already exist")
            
            return {
                "success": True,
                "changes_made": changes_made,
                "message": "User relations migration completed"
            }
            
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            db.session.rollback()
            return {
                "success": False,
                "message": f"Migration failed: {str(e)}"
            }

if __name__ == "__main__":
    result = migrate_user_relations()
    if result["success"]:
        print("🎉 Migration successful!")
    else:
        print("💥 Migration failed!")
        print(result["message"]) 