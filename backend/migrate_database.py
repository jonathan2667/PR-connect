"""
Database Migration Script
Adds missing columns to match the SQLAlchemy models
"""

import os
import psycopg2
from dotenv import load_dotenv

def run_migration():
    """Add missing columns to the requests table"""
    
    # Load environment variables
    load_dotenv()
    DATABASE_URL = os.environ.get('DATABASE_URL')
    
    if not DATABASE_URL:
        print("❌ DATABASE_URL not found in environment variables")
        return False
    
    try:
        # Connect to database
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        print("🔍 Checking current table structure...")
        
        # Check current columns
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'requests'
        """)
        existing_columns = [row[0] for row in cur.fetchall()]
        print(f"Existing columns: {existing_columns}")
        
        # Define the columns we need to add
        columns_to_add = [
            ("company_name", "VARCHAR(100)"),
            ("category", "VARCHAR(50)"), 
            ("contact_info", "VARCHAR(200)"),
            ("additional_notes", "TEXT"),
            ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
        ]
        
        # Add missing columns
        for column_name, column_type in columns_to_add:
            if column_name not in existing_columns:
                try:
                    print(f"➕ Adding column: {column_name} ({column_type})")
                    cur.execute(f"ALTER TABLE requests ADD COLUMN {column_name} {column_type};")
                    print(f"✅ Added {column_name}")
                except Exception as e:
                    print(f"⚠️ Error adding {column_name}: {e}")
            else:
                print(f"✓ Column {column_name} already exists")
        
        # Also check responses table
        print("\n🔍 Checking responses table...")
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'responses'
        """)
        response_columns = [row[0] for row in cur.fetchall()]
        print(f"Existing response columns: {response_columns}")
        
        # Add missing columns to responses table
        response_columns_to_add = [
            ("tone", "VARCHAR(100)"),
            ("word_count", "INTEGER"),
            ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
        ]
        
        for column_name, column_type in response_columns_to_add:
            if column_name not in response_columns:
                try:
                    print(f"➕ Adding response column: {column_name} ({column_type})")
                    cur.execute(f"ALTER TABLE responses ADD COLUMN {column_name} {column_type};")
                    print(f"✅ Added {column_name} to responses")
                except Exception as e:
                    print(f"⚠️ Error adding {column_name} to responses: {e}")
            else:
                print(f"✓ Response column {column_name} already exists")
        
        # Commit changes
        conn.commit()
        print("\n✅ Database migration completed successfully!")
        
        # Show final structure
        print("\n📋 Final table structure:")
        cur.execute("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'requests' 
            ORDER BY ordinal_position
        """)
        for row in cur.fetchall():
            print(f"  {row[0]}: {row[1]} (nullable: {row[2]})")
        
        cur.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting database migration...")
    success = run_migration()
    if success:
        print("🎉 Migration completed! You can now restart your Flask app.")
    else:
        print("💥 Migration failed. Please check the errors above.")