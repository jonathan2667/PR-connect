#!/usr/bin/env python3
"""
Comprehensive Database Migration Script for PR-Connect
Creates all database tables and initializes default data
Can be run standalone or called from the API
Supports both fresh table creation and incremental updates
"""

import os
import sys
import psycopg2
from flask import Flask
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import models
from models import db, NewsOutlet, Request, Response, Transcript, User

# Available outlets and categories (same as in app.py)
AVAILABLE_OUTLETS = {
    "TechCrunch": {
        "description": "Tech-focused, startup-friendly coverage",
        "audience": "Developers, entrepreneurs, tech industry",
        "icon": "⚡"
    },
    "The Verge": {
        "description": "Consumer tech and digital lifestyle",
        "audience": "Tech consumers, early adopters",
        "icon": "📱"
    },
    "Forbes": {
        "description": "Business and financial perspective",
        "audience": "Executives, investors, business leaders",
        "icon": "💼"
    },
    "General": {
        "description": "Broad appeal, standard format",
        "audience": "General public, all media outlets",
        "icon": "📰"
    }
}

def create_app_for_migration():
    """Create Flask app for database operations"""
    app = Flask(__name__)
    
    # Database configuration
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("❌ ERROR: DATABASE_URL environment variable not found!")
        print("Please set your PostgreSQL database URL.")
        sys.exit(1)
    
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize database
    db.init_app(app)
    
    return app

def check_and_update_table_structure(database_url, verbose=True):
    """
    Check existing table structure and add missing columns using raw SQL
    This handles incremental updates to existing tables
    """
    
    def log(message):
        if verbose:
            print(message)
    
    try:
        # Connect to database using raw psycopg2
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        
        log("🔍 Checking existing table structure for incremental updates...")
        
        # Check if tables exist
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        existing_tables = [row[0] for row in cur.fetchall()]
        log(f"Existing tables: {existing_tables}")
        
        updates_made = []
        
        # Update requests table if it exists
        if 'requests' in existing_tables:
            log("📋 Checking requests table structure...")
            cur.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'requests'
            """)
            existing_columns = [row[0] for row in cur.fetchall()]
            
            # Define columns that should exist
            required_columns = [
                ("company_name", "VARCHAR(100)"),
                ("category", "VARCHAR(50)"), 
                ("contact_info", "VARCHAR(200)"),
                ("additional_notes", "TEXT"),
                ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
            ]
            
            for column_name, column_type in required_columns:
                if column_name not in existing_columns:
                    try:
                        log(f"➕ Adding column: {column_name} ({column_type})")
                        cur.execute(f"ALTER TABLE requests ADD COLUMN {column_name} {column_type};")
                        updates_made.append(f"Added {column_name} to requests")
                    except Exception as e:
                        log(f"⚠️ Error adding {column_name}: {e}")
        
        # Update responses table if it exists
        if 'responses' in existing_tables:
            log("📋 Checking responses table structure...")
            cur.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'responses'
            """)
            response_columns = [row[0] for row in cur.fetchall()]
            
            required_response_columns = [
                ("tone", "VARCHAR(100)"),
                ("word_count", "INTEGER"),
                ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
            ]
            
            for column_name, column_type in required_response_columns:
                if column_name not in response_columns:
                    try:
                        log(f"➕ Adding response column: {column_name} ({column_type})")
                        cur.execute(f"ALTER TABLE responses ADD COLUMN {column_name} {column_type};")
                        updates_made.append(f"Added {column_name} to responses")
                    except Exception as e:
                        log(f"⚠️ Error adding {column_name} to responses: {e}")
        
        # Update users table if it exists
        if 'users' in existing_tables:
            log("👤 Checking users table structure...")
            cur.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users'
            """)
            user_columns = [row[0] for row in cur.fetchall()]
            
            required_user_columns = [
                ("phone", "VARCHAR(20)"),
                ("location", "VARCHAR(100)"),
                ("is_active", "BOOLEAN DEFAULT TRUE"),
                ("updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
            ]
            
            for column_name, column_type in required_user_columns:
                if column_name not in user_columns:
                    try:
                        log(f"➕ Adding user column: {column_name} ({column_type})")
                        cur.execute(f"ALTER TABLE users ADD COLUMN {column_name} {column_type};")
                        updates_made.append(f"Added {column_name} to users")
                    except Exception as e:
                        log(f"⚠️ Error adding {column_name} to users: {e}")
        
        # Update transcripts table if it exists
        if 'transcripts' in existing_tables:
            log("📝 Checking transcripts table structure...")
            cur.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'transcripts'
            """)
            transcript_columns = [row[0] for row in cur.fetchall()]
            
            required_transcript_columns = [
                ("word_count", "INTEGER"),
                ("preview", "VARCHAR(200)")
            ]
            
            for column_name, column_type in required_transcript_columns:
                if column_name not in transcript_columns:
                    try:
                        log(f"➕ Adding transcript column: {column_name} ({column_type})")
                        cur.execute(f"ALTER TABLE transcripts ADD COLUMN {column_name} {column_type};")
                        updates_made.append(f"Added {column_name} to transcripts")
                    except Exception as e:
                        log(f"⚠️ Error adding {column_name} to transcripts: {e}")
        
        # Commit all changes
        conn.commit()
        cur.close()
        conn.close()
        
        if updates_made:
            log(f"✅ Applied {len(updates_made)} structural updates:")
            for update in updates_made:
                log(f"  • {update}")
        else:
            log("✅ All table structures are up to date")
        
        return updates_made
        
    except Exception as e:
        log(f"❌ Error checking table structure: {e}")
        return []

def run_migration(app_context=None, drop_existing=False, verbose=True):
    """
    Run database migration
    
    Args:
        app_context: Flask app context (if called from API)
        drop_existing: Whether to drop existing tables (dangerous in production!)
        verbose: Whether to print detailed output
    
    Returns:
        dict: Migration results
    """
    
    def log(message):
        if verbose:
            print(message)
    
    results = {
        "success": False,
        "message": "",
        "tables_created": [],
        "outlets_added": [],
        "structural_updates": [],
        "counts": {}
    }
    
    try:
        # If no app context provided, create one
        if app_context is None:
            app = create_app_for_migration()
            with app.app_context():
                return run_migration(app, drop_existing, verbose)
        
        # Get database URL for raw SQL operations
        database_url = os.environ.get('DATABASE_URL')
        
        # First, check for structural updates needed (only if not dropping)
        if not drop_existing:
            log("🔧 Checking for required structural updates...")
            structural_updates = check_and_update_table_structure(database_url, verbose)
            results["structural_updates"] = structural_updates
        
        if drop_existing:
            log("🗑️ Dropping existing tables...")
            db.drop_all()
            log("✅ Existing tables dropped")
        
        # Create all tables using SQLAlchemy
        log("📊 Creating/verifying database tables...")
        db.create_all()
        
        # Track created tables
        tables_created = ['users', 'news_outlets', 'requests', 'responses', 'transcripts']
        results["tables_created"] = tables_created
        log(f"✅ Created/verified tables: {', '.join(tables_created)}")
        
        # Initialize default news outlets
        log("📰 Adding default news outlets...")
        outlets_added = []
        
        for outlet_name, outlet_info in AVAILABLE_OUTLETS.items():
            existing = NewsOutlet.query.filter_by(name=outlet_name).first()
            if not existing:
                outlet = NewsOutlet(name=outlet_name)
                db.session.add(outlet)
                outlets_added.append(outlet_name)
                log(f"  ✅ Added outlet: {outlet_name}")
            else:
                log(f"  ℹ️ Outlet already exists: {outlet_name}")
        
        # Commit changes
        db.session.commit()
        log("💾 Changes committed to database")
        
        # Get final counts
        counts = {
            "users": User.query.count(),
            "news_outlets": NewsOutlet.query.count(),
            "requests": Request.query.count(),
            "responses": Response.query.count(),
            "transcripts": Transcript.query.count()
        }
        results["counts"] = counts
        results["outlets_added"] = outlets_added
        
        log("\n✅ Database migration completed successfully!")
        log(f"📊 Final table counts:")
        for table, count in counts.items():
            log(f"  {table}: {count}")
        
        # Create summary message
        message_parts = []
        if results["tables_created"]:
            message_parts.append(f"Verified {len(results['tables_created'])} tables")
        if results["outlets_added"]:
            message_parts.append(f"added {len(results['outlets_added'])} outlets")
        if results["structural_updates"]:
            message_parts.append(f"applied {len(results['structural_updates'])} structural updates")
        
        results["success"] = True
        results["message"] = f"Migration completed successfully. {', '.join(message_parts) if message_parts else 'No changes needed'}."
        
        return results
        
    except Exception as e:
        error_msg = f"Migration failed: {str(e)}"
        log(f"❌ {error_msg}")
        
        try:
            db.session.rollback()
            log("🔄 Database session rolled back")
        except:
            pass
        
        results["success"] = False
        results["message"] = error_msg
        return results

def migrate_database_standalone():
    """Run migration as standalone script"""
    print("🚀 Starting PR-Connect Database Migration")
    print("=" * 70)
    
    # Parse command line arguments
    drop_existing = '--drop' in sys.argv
    incremental_only = '--incremental' in sys.argv
    
    if drop_existing:
        print("⚠️ WARNING: Will drop existing tables!")
        response = input("Are you sure? Type 'yes' to continue: ")
        if response.lower() != 'yes':
            print("Migration cancelled.")
            exit(0)
    elif incremental_only:
        print("🔧 Running incremental updates only (table structure fixes)")
    else:
        print("ℹ️ Running safe migration (will not drop existing tables)")
        print("   Use --drop flag to drop existing tables")
        print("   Use --incremental flag for structure updates only")
    
    print("=" * 70)
    
    if incremental_only:
        # Run only structural updates
        database_url = os.environ.get('DATABASE_URL')
        if not database_url:
            print("❌ ERROR: DATABASE_URL environment variable not found!")
            exit(1)
        
        updates = check_and_update_table_structure(database_url, verbose=True)
        print("=" * 70)
        if updates:
            print(f"🎉 Applied {len(updates)} structural updates!")
        else:
            print("✅ No structural updates needed!")
    else:
        # Run full migration
        results = run_migration(drop_existing=drop_existing, verbose=True)
        print("=" * 70)
        
        if results["success"]:
            print("🎉 Migration completed successfully!")
            print(f"📈 Summary: {results['message']}")
            if results["structural_updates"]:
                print(f"🔧 Structural updates: {len(results['structural_updates'])}")
            exit(0)
        else:
            print("💥 Migration failed!")
            print(f"❌ Error: {results['message']}")
            exit(1)

def initialize_database_for_api(app):
    """
    Initialize database from API endpoint
    (Safe version - doesn't drop existing tables)
    """
    with app.app_context():
        return run_migration(app, drop_existing=False, verbose=False)

if __name__ == '__main__':
    migrate_database_standalone() 