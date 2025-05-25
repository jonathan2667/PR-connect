"""
Press Release Generation Web Interface
Professional platform for AI-powered press release creation and management
"""

from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from uagents.communication import send_sync_message
from uagents import Model
from typing import List, Optional
import asyncio
import json
import os
from datetime import datetime

# Load environment variables from .env file
load_dotenv()

# Import database models
from models import db, NewsOutlet, Request, Response

# Import message models from agent
class PressReleaseRequest(Model):
    title: str
    body: str
    company_name: str
    target_outlets: List[str]
    category: str
    contact_info: Optional[str] = ""
    additional_notes: Optional[str] = ""

class GeneratedPressRelease(Model):
    outlet: str
    content: str
    tone: str
    word_count: int

class PressReleaseResponse(Model):
    request_id: str
    company_name: str
    category: str
    generated_releases: List[GeneratedPressRelease]
    timestamp: str
    status: str

# Configuration - Update with your agent address
AGENT_ADDRESS = os.environ.get('AGENT_ADRESS')

# Available outlets and categories (fallback for when DB is not available)
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

PRESS_RELEASE_CATEGORIES = [
    "Product Launch",
    "Funding Round", 
    "Acquisition",
    "Partnership",
    "Executive Appointment",
    "Company Milestone",
    "Event Announcement",
    "Research & Development",
    "Awards & Recognition",
    "Other"
]

app = Flask(__name__)

# Database configuration
# You'll need to set your DATABASE_URL environment variable
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://username:password@localhost/prconnect')
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db.init_app(app)

# Configure CORS for both development and production
def get_cors_origins():
    """Get CORS origins based on environment"""
    # Default local development origins
    origins = [
        "http://localhost:6969",  # Local frontend
        "http://localhost:3000",  # Alternative local frontend port
        "http://127.0.0.1:6969",  # Alternative localhost
    ]
    
    # Add production origins from environment variables
    frontend_url = os.environ.get('FRONTEND_URL')
    if frontend_url:
        origins.append(frontend_url)
        # Also add https version if http is provided
        if frontend_url.startswith('http://'):
            origins.append(frontend_url.replace('http://', 'https://'))
    
    # Add common Render patterns (in case FRONTEND_URL is not set)
    render_service_name = os.environ.get('RENDER_SERVICE_NAME')
    if render_service_name:
        origins.extend([
            f"https://{render_service_name}.onrender.com",
            f"https://{render_service_name}-frontend.onrender.com",
            f"https://{render_service_name}-web.onrender.com"
        ])
    
    # Allow common Render patterns for PR-connect - be more comprehensive
    origins.extend([
        "https://pr-connect-frontend.onrender.com",
        "https://pr-connect-backend.onrender.com",

    ])
    
    return origins

# Enable CORS for multiple environments with more permissive settings
allowed_origins = get_cors_origins()
print(f"🌐 CORS enabled for origins: {allowed_origins}")

# Use more permissive CORS settings for production debugging
cors_config = {
    'origins': allowed_origins,
    'supports_credentials': True,
    'methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    'allow_headers': ['Content-Type', 'Authorization', 'Access-Control-Allow-Credentials']
}

CORS(app, **cors_config)

@app.before_request
def log_request_info():
    """Log request information for debugging CORS issues"""
    origin = request.headers.get('Origin')
    if origin:
        print(f"🌍 Incoming request from origin: {origin}")
        print(f"📍 Request path: {request.path}")
        print(f"🔧 Method: {request.method}")
        if origin not in allowed_origins:
            print(f"⚠️ Origin {origin} not in allowed origins: {allowed_origins}")

@app.after_request
def after_request(response):
    """Add CORS headers manually as backup"""
    origin = request.headers.get('Origin')
    if origin and origin in allowed_origins:
        response.headers.add('Access-Control-Allow-Origin', origin)
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

@app.route('/<path:path>', methods=['OPTIONS'])
@app.route('/', methods=['OPTIONS'])
def handle_options(path=None):
    """Handle preflight OPTIONS requests for all routes"""
    origin = request.headers.get('Origin')
    if origin in allowed_origins:
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', origin)
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    return jsonify({'error': 'Origin not allowed'}), 403

def run_async(coro):
    """Helper to run async functions in Flask routes"""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(coro)

async def generate_press_releases(pr_request: PressReleaseRequest):
    """Send press release request to agent and get generated content"""
    try:
        response = await send_sync_message(
            destination=AGENT_ADDRESS,
            message=pr_request,
            timeout=30
        )
        return True, response
    except Exception as e:
        return False, str(e)

@app.route('/')
def home():
    """API service information"""
    return jsonify({
        "service": "PR-Connect Backend API",
        "status": "healthy",
        "version": "1.0.0",
        "description": "AI-powered press release generation service",
        "endpoints": {
            "health": "/health",
            "generate": "/generate",
            "outlets": "/api/outlets",
            "categories": "/api/categories",
            "requests": "/api/requests"
        },
        "frontend_url": os.environ.get('FRONTEND_URL', 'http://localhost:6969'),
        "docs": "Visit the frontend URL for the web interface"
    })

@app.route('/generate', methods=['POST'])
def generate_press_release():
    """Handle press release generation request and store in database"""
    try:
        # Extract form data
        data = request.get_json()
        print(f"🔍 Received request data: {data}")
        
        # Create press release request
        pr_request = PressReleaseRequest(
            title=data.get('title', ''),
            body=data.get('body', ''),
            company_name=data.get('company_name', ''),
            target_outlets=data.get('target_outlets', []),
            category=data.get('category', ''),
            contact_info=data.get('contact_info', ''),
            additional_notes=data.get('additional_notes', '')
        )
        
        print(f"📤 Sending to agent: {pr_request.dict()}")
        
        # Generate press releases via agent
        success, response = run_async(generate_press_releases(pr_request))
        
        print(f"📥 Received from agent - Success: {success}")
        
        if success:
            print(f"✅ Message delivered to agent successfully")
            
            # Generate content locally using the same logic as the agent
            sample_releases = []
            db_requests = []  # Store database request objects
            
            for outlet_name in pr_request.target_outlets:
                # Find or create outlet in database
                try:
                    outlet = NewsOutlet.query.filter_by(name=outlet_name).first()
                    if not outlet:
                        outlet = NewsOutlet(name=outlet_name)
                        db.session.add(outlet)
                        db.session.flush()  # Get the ID
                    
                    # Create request record in database
                    db_request = Request(
                        title=pr_request.title,
                        body=pr_request.body,
                        news_outlet_id=outlet.id,
                        company_name=pr_request.company_name,
                        category=pr_request.category,
                        contact_info=pr_request.contact_info,
                        additional_notes=pr_request.additional_notes
                    )
                    db.session.add(db_request)
                    db.session.flush()  # Get the ID
                    db_requests.append(db_request)
                    
                except Exception as db_error:
                    print(f"⚠️ Database error for outlet {outlet_name}: {db_error}")
                    # Continue without database storage for this outlet
                    pass
                
                # Generate content based on outlet style (same as agent logic)
                content = generate_content_for_outlet(pr_request, outlet_name)
                
                tone_map = {
                    "TechCrunch": "Direct, tech-focused, startup-friendly",
                    "The Verge": "Consumer-focused, accessible tech coverage", 
                    "Forbes": "Business-focused, executive perspective",
                    "General": "Balanced, broad appeal"
                }
                
                tone = tone_map.get(outlet_name, "Balanced, broad appeal")
                word_count = len(content.split())
                
                # Store response in database
                try:
                    if db_requests:  # Only if we have a database request
                        db_request = next((req for req in db_requests if req.news_outlet.name == outlet_name), None)
                        if db_request:
                            db_response = Response(
                                body=content,
                                request_id=db_request.id,
                                tone=tone,
                                word_count=word_count
                            )
                            db.session.add(db_response)
                except Exception as db_error:
                    print(f"⚠️ Database error storing response for {outlet_name}: {db_error}")
                    # Continue without database storage
                    pass
                
                sample_releases.append({
                    "outlet": outlet_name,
                    "content": content,
                    "tone": tone,
                    "word_count": word_count
                })
            
            # Commit all database changes
            try:
                db.session.commit()
                print(f"💾 Stored {len(db_requests)} requests and {len(sample_releases)} responses in database")
            except Exception as db_error:
                print(f"⚠️ Database commit error: {db_error}")
                db.session.rollback()
            
            response_data = {
                "request_id": f"PR_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "company_name": pr_request.company_name,
                "category": pr_request.category,
                "generated_releases": sample_releases,
                "timestamp": datetime.now().isoformat(),
                "status": "completed"
            }
            print(f"✅ Generated {len(sample_releases)} press releases successfully")
            
            return jsonify({
                "success": True,
                "data": response_data,
                "message": f"Generated {len(response_data.get('generated_releases', []))} press releases successfully"
            })
        else:
            print(f"❌ Generation failed: {response}")
            return jsonify({
                "success": False,
                "message": f"Generation failed: {response}"
            })
            
    except Exception as e:
        print(f"💥 Exception in generate_press_release: {str(e)}")
        import traceback
        traceback.print_exc()
        # Rollback any pending database changes
        try:
            db.session.rollback()
        except:
            pass
        return jsonify({
            "success": False,
            "message": f"Error processing request: {str(e)}"
        })

def generate_content_for_outlet(pr_request: PressReleaseRequest, outlet: str) -> str:
    """Generate content based on outlet style"""
    if outlet == "TechCrunch":
        return f"""**{pr_request.title}**

{pr_request.company_name} today announced {pr_request.body.lower()}

**Key Highlights:**
• Innovation-driven approach to market disruption
• Technology-first solution addressing key industry challenges  
• Positioned for rapid scaling and market adoption

**About the {pr_request.category}:**
This development represents a significant milestone in {pr_request.company_name}'s growth trajectory, demonstrating the company's commitment to pushing technological boundaries and delivering value to users.

**Market Impact:**
The announcement is expected to strengthen {pr_request.company_name}'s position in the competitive landscape, potentially influencing industry standards and user expectations.

**Additional Information:**
{pr_request.additional_notes if pr_request.additional_notes else 'Further details will be available through official company channels.'}

**Contact:**
{pr_request.contact_info if pr_request.contact_info else 'Media inquiries welcome through standard channels.'}

*This release was optimized for TechCrunch's tech-focused, startup-friendly editorial style.*"""

    elif outlet == "The Verge":
        return f"""# {pr_request.title}

{pr_request.company_name} is making waves with {pr_request.body.lower()}

## What This Means for Users

This {pr_request.category.lower()} represents more than just another corporate announcement — it's about how technology continues to reshape our daily experiences and interactions.

## The Consumer Angle

For everyday users, this development translates to:
- Enhanced user experience and accessibility
- More intuitive interaction with technology
- Broader implications for digital lifestyle trends

## Company Perspective

"{pr_request.body}" said representatives from {pr_request.company_name}, emphasizing the consumer-first approach that drives their innovation strategy.

## Looking Forward

This announcement positions {pr_request.company_name} at the intersection of technology and user experience, areas where The Verge's audience expects cutting-edge developments.

## Additional Context
{pr_request.additional_notes if pr_request.additional_notes else 'More details expected as the story develops.'}

**Media Contact:** {pr_request.contact_info if pr_request.contact_info else 'Available upon request'}

*Styled for The Verge's consumer-tech focus and engaging narrative approach.*"""

    elif outlet == "Forbes":
        return f"""**{pr_request.title}**
*Strategic {pr_request.category} Positions Company for Market Leadership*

**Executive Summary**

{pr_request.company_name} today announced {pr_request.body}, a strategic move that underscores the company's commitment to market expansion and shareholder value creation.

**Business Impact Analysis**

This {pr_request.category.lower()} represents a calculated investment in:
- Market position strengthening
- Operational efficiency improvements  
- Long-term value creation for stakeholders
- Competitive advantage development

**Market Dynamics**

The timing of this announcement reflects {pr_request.company_name}'s strategic response to evolving market conditions and positions the company to capitalize on emerging opportunities in their sector.

**Financial Implications**

Industry analysts expect this {pr_request.category.lower()} to contribute positively to the company's growth trajectory, potentially impacting:
- Revenue generation capabilities
- Market share expansion
- Operational scalability
- Investment attractiveness

**Leadership Commentary**

The {pr_request.category.lower()} aligns with {pr_request.company_name}'s broader strategic vision and demonstrates executive leadership's commitment to sustainable growth and market innovation.

**Additional Strategic Context**
{pr_request.additional_notes if pr_request.additional_notes else 'Further strategic details to be disclosed in upcoming investor communications.'}

**Investor Relations Contact:** {pr_request.contact_info if pr_request.contact_info else 'Available through official investor relations channels'}

*Formatted for Forbes' business-executive audience with focus on market impact and financial implications.*"""

    else:  # General
        return f"""FOR IMMEDIATE RELEASE

**{pr_request.title}**

{pr_request.company_name} Announces {pr_request.category}

**[City, Date]** – {pr_request.company_name} today announced {pr_request.body}

**About This {pr_request.category}:**

This development represents an important milestone for {pr_request.company_name} and demonstrates the organization's ongoing commitment to innovation and growth.

**Key Details:**

• **What:** {pr_request.category} by {pr_request.company_name}
• **Impact:** Enhanced capabilities and market position
• **Timeline:** Effective immediately
• **Scope:** Company-wide initiative

**Company Background:**

{pr_request.company_name} continues to build on its foundation of innovation and customer service, with this {pr_request.category.lower()} marking another step in the company's strategic evolution.

**Additional Information:**
{pr_request.additional_notes if pr_request.additional_notes else 'Additional details available upon request.'}

**Media Contact:**
{pr_request.contact_info if pr_request.contact_info else 'Media inquiries welcome'}

**About {pr_request.company_name}:**
[Standard company boilerplate would appear here]

###

*This press release follows standard industry formatting for broad media distribution.*"""

@app.route('/health')
def health_check():
    """System health check"""
    return jsonify({
        "status": "healthy",
        "service": "Press Release Generator",
        "agent_address": AGENT_ADDRESS,
        "available_outlets": len(AVAILABLE_OUTLETS),
        "available_categories": len(PRESS_RELEASE_CATEGORIES),
        "timestamp": datetime.now().isoformat()
    })

@app.route('/cors-test')
def cors_test():
    """Simple CORS test endpoint"""
    origin = request.headers.get('Origin', 'unknown')
    return jsonify({
        "message": "CORS test successful",
        "origin": origin,
        "allowed_origins": allowed_origins,
        "cors_working": True,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/outlets')
def get_outlets():
    """API endpoint for outlet information - load from database or fallback to static"""
    try:
        # Try to load from database
        outlets = NewsOutlet.query.all()
        if outlets:
            outlet_data = {}
            for outlet in outlets:
                # Use static data for additional info, database for name
                static_info = AVAILABLE_OUTLETS.get(outlet.name, {
                    "description": f"Coverage for {outlet.name}",
                    "audience": "General audience",
                    "icon": "📰"
                })
                outlet_data[outlet.name] = static_info
            return jsonify(outlet_data)
        else:
            # Fallback to static data
            return jsonify(AVAILABLE_OUTLETS)
    except Exception as e:
        print(f"⚠️ Database error loading outlets: {e}")
        # Fallback to static data
        return jsonify(AVAILABLE_OUTLETS)

@app.route('/api/categories') 
def get_categories():
    """API endpoint for category information"""
    return jsonify(PRESS_RELEASE_CATEGORIES)

@app.route('/api/requests', methods=['GET'])
def get_requests():
    """Get all press release requests with their responses"""
    try:
        requests = Request.query.order_by(Request.created_at.desc()).all()
        request_data = []
        for req in requests:
            req_dict = req.to_dict()
            req_dict['responses'] = [resp.to_dict() for resp in req.responses]
            request_data.append(req_dict)
        
        return jsonify({
            "success": True,
            "data": request_data,
            "count": len(request_data)
        })
    except Exception as e:
        print(f"⚠️ Database error loading requests: {e}")
        return jsonify({
            "success": False,
            "message": f"Error loading requests: {str(e)}"
        })

@app.route('/api/requests/<int:request_id>', methods=['GET'])
def get_request(request_id):
    """Get a specific request with its responses"""
    try:
        req = Request.query.get_or_404(request_id)
        req_dict = req.to_dict()
        req_dict['responses'] = [resp.to_dict() for resp in req.responses]
        
        return jsonify({
            "success": True,
            "data": req_dict
        })
    except Exception as e:
        print(f"⚠️ Database error loading request {request_id}: {e}")
        return jsonify({
            "success": False,
            "message": f"Error loading request: {str(e)}"
        })

@app.route('/api/requests/<int:request_id>', methods=['DELETE'])
def delete_request(request_id):
    """Delete a specific request and all its responses"""
    try:
        req = Request.query.get(request_id)
        if not req:
            return jsonify({
                "success": False,
                "message": "Request not found"
            }), 404
        
        # Store info for response
        company_name = req.company_name
        title = req.title
        
        # Delete the request (responses will be automatically deleted due to cascade)
        db.session.delete(req)
        db.session.commit()
        
        print(f"🗑️ Deleted request {request_id}: '{title}' by {company_name}")
        
        return jsonify({
            "success": True,
            "message": f"Successfully deleted request '{title}'"
        })
        
    except Exception as e:
        print(f"⚠️ Database error deleting request {request_id}: {e}")
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": f"Error deleting request: {str(e)}"
        }), 500

@app.route('/api/init-db', methods=['POST'])
def init_database():
    """Initialize database tables (for development/setup)"""
    try:
        # Create all tables
        with app.app_context():
            db.create_all()
            
            # Add default outlets if they don't exist
            for outlet_name in AVAILABLE_OUTLETS.keys():
                existing = NewsOutlet.query.filter_by(name=outlet_name).first()
                if not existing:
                    outlet = NewsOutlet(name=outlet_name)
                    db.session.add(outlet)
            
            db.session.commit()
            
        return jsonify({
            "success": True,
            "message": "Database initialized successfully"
        })
    except Exception as e:
        print(f"💥 Database initialization error: {e}")
        return jsonify({
            "success": False,
            "message": f"Database initialization failed: {str(e)}"
        })

if __name__ == '__main__':
    print("🚀 Starting Press Release Generation Platform")
    print(f"🤖 Agent Address: {AGENT_ADDRESS}")
    print(f"🌐 Web Interface: http://localhost:5001")
    print(f"📊 Available Outlets: {', '.join(AVAILABLE_OUTLETS.keys())}")
    print(f"📁 Available Categories: {len(PRESS_RELEASE_CATEGORIES)} types")
    
    # Test database connection
    database_url = os.environ.get('DATABASE_URL')
    if database_url and 'postgresql' in database_url:
        print("🗄️ Database Configuration Found")
        try:
            with app.app_context():
                # Test database connection
                db.create_all()
                print("✅ Database tables created/verified")
                
                # Check/Add default outlets
                outlets = NewsOutlet.query.all()
                print(f"📊 Found {len(outlets)} outlets in database")
                
                if len(outlets) == 0:
                    print("📰 Adding default outlets...")
                    for outlet_name in AVAILABLE_OUTLETS.keys():
                        outlet = NewsOutlet(name=outlet_name)
                        db.session.add(outlet)
                    db.session.commit()
                    print(f"✅ Added {len(AVAILABLE_OUTLETS)} default outlets")
                
                print("🗄️ PostgreSQL database connected successfully!")
        except Exception as e:
            print(f"⚠️ Database connection failed: {e}")
            print("📝 App will run with static data fallback")
    else:
        print("📝 No database configured, running with static data")
    
    print("=" * 70)
    
    # Get port from environment variable (for Render deployment)
    port = int(os.environ.get('PORT', 5001))
    
    # Determine if we're in production
    is_production = os.environ.get('FLASK_ENV') == 'production'
    
    if is_production:
        print(f"🏭 Running in PRODUCTION mode on port {port}")
        app.run(host='0.0.0.0', port=port, debug=False)
    else:
        print(f"🔧 Running in DEVELOPMENT mode on port {port}")
        app.run(debug=True, host='0.0.0.0', port=port) 
