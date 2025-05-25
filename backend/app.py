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

# JWT and security imports
import jwt
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash

# Load environment variables from .env file
load_dotenv()

# Import database models
from models import db, NewsOutlet, Request, Response, Transcript, User

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
AGENT_ADDRESS = os.environ.get('AGENT_ADDRESS')

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

# JWT Configuration
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'

def generate_token(user_id, email):
    """Generate JWT token for user authentication"""
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.utcnow().timestamp() + (24 * 60 * 60)  # 24 hours
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def verify_token(token):
    """Verify JWT token and return user data"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def require_auth(f):
    """Decorator to require authentication for endpoints"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                pass
        
        if not token:
            return jsonify({'message': 'Authentication token required'}), 401
        
        payload = verify_token(token)
        if not payload:
            return jsonify({'message': 'Invalid or expired token'}), 401
        
        # Add user info to request context
        request.current_user = payload
        return f(*args, **kwargs)
    
    return decorated_function

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
        "https://pr-connect-frontend-xocv.onrender.com",  # Current deployed frontend
        "https://pr-connect-r40k.onrender.com",
        "https://pr-connect-r40k-frontend.onrender.com",
        "https://pr-connect-r40k-web.onrender.com",
        "https://pr-connect-r40k-frontend.onrender.com",
        "https://pr-connect-frontend.onrender.com",
        "https://pr-connect-backend.onrender.com"
    ])
    
    return origins

def is_origin_allowed(origin):
    """Check if origin is allowed, including pattern matching for Render deployments"""
    if not origin:
        return False
    
    # Check exact matches first
    allowed_origins = get_cors_origins()
    if origin in allowed_origins:
        return True
    
    # Allow any pr-connect related Render deployment
    if origin.startswith('https://pr-connect') and origin.endswith('.onrender.com'):
        return True
    
    return False

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
        if not is_origin_allowed(origin):
            print(f"⚠️ Origin {origin} not in allowed patterns")
        else:
            print(f"✅ Origin {origin} is allowed")

@app.after_request
def after_request(response):
    """Add CORS headers manually as backup"""
    origin = request.headers.get('Origin')
    if origin and is_origin_allowed(origin):
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
    if is_origin_allowed(origin):
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
        # Check if agent address is configured
        if not AGENT_ADDRESS:
            print("⚠️ AGENT_ADDRESS not configured, skipping agent call")
            return True, "Agent not configured - generating content locally"
        
        print(f"🔗 Attempting to connect to agent at: {AGENT_ADDRESS}")
        print(f"📡 Sending message to AgentVerse...")
        
        response = await send_sync_message(
            destination=AGENT_ADDRESS,
            message=pr_request,
            timeout=30
        )
        
        print(f"✅ Successfully received response from agent")
        print(f"📦 Response type: {type(response)}")
        return True, response
        
    except Exception as e:
        print(f"❌ Agent communication error: {str(e)}")
        print(f"🔍 Error type: {type(e)}")
        import traceback
        print(f"📋 Full traceback: {traceback.format_exc()}")
        return True, f"Agent communication failed: {str(e)} - generating content locally"

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
@require_auth
def generate_press_release():
    """Handle press release generation request and store in database"""
    try:
        # Get current user
        user_id = request.current_user['user_id']
        
        # Extract form data
        data = request.get_json()
        print(f"🔍 Received request data from user {user_id}: {data}")
        
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
        print(f"📥 Agent response: {response}")
        
        if success and response and AGENT_ADDRESS:
            # Try to parse agent response
            try:
                # Check if response is already a PressReleaseResponse object
                if hasattr(response, 'generated_releases'):
                    agent_response = response
                # Or if it's a dictionary that can be converted
                elif isinstance(response, dict) and 'generated_releases' in response:
                    agent_response = response
                else:
                    print(f"⚠️ Unexpected agent response format: {type(response)}")
                    raise ValueError("Invalid agent response format")
                
                print(f"✅ Successfully parsed agent response with {len(agent_response.generated_releases if hasattr(agent_response, 'generated_releases') else agent_response['generated_releases'])} releases")
                
                # Store agent-generated content in database
                db_requests = []
                sample_releases = []
                
                generated_releases = agent_response.generated_releases if hasattr(agent_response, 'generated_releases') else agent_response['generated_releases']
                
                for release in generated_releases:
                    outlet_name = release.outlet if hasattr(release, 'outlet') else release['outlet']
                    content = release.content if hasattr(release, 'content') else release['content']
                    tone = release.tone if hasattr(release, 'tone') else release['tone']
                    word_count = release.word_count if hasattr(release, 'word_count') else release['word_count']
                    
                    # Find or create outlet in database
                    try:
                        outlet = NewsOutlet.query.filter_by(name=outlet_name).first()
                        if not outlet:
                            outlet = NewsOutlet(name=outlet_name)
                            db.session.add(outlet)
                            db.session.flush()
                        
                        # Create request record in database
                        db_request = Request(
                            title=pr_request.title or 'Untitled Press Release',
                            body=pr_request.body or 'No content provided',
                            news_outlet_id=outlet.id,
                            user_id=user_id,
                            company_name=pr_request.company_name or 'Unknown Company',
                            category=pr_request.category or 'Company Milestone',
                            contact_info=pr_request.contact_info or '',
                            additional_notes=pr_request.additional_notes or ''
                        )
                        db.session.add(db_request)
                        db.session.flush()
                        db_requests.append(db_request)
                        
                        # Store agent response in database
                        db_response = Response(
                            body=content,
                            request_id=db_request.id,
                            tone=tone,
                            word_count=word_count
                        )
                        db.session.add(db_response)
                        
                    except Exception as db_error:
                        print(f"⚠️ Database error for outlet {outlet_name}: {db_error}")
                        # Continue without database storage for this outlet
                        pass
                    
                    sample_releases.append({
                        "outlet": outlet_name,
                        "content": content,
                        "tone": tone,
                        "word_count": word_count
                    })
                
                # Commit database changes
                try:
                    db.session.commit()
                    print(f"💾 Stored {len(db_requests)} requests and {len(sample_releases)} agent responses in database")
                except Exception as db_error:
                    print(f"⚠️ Database commit error: {db_error}")
                    db.session.rollback()
                
                # Return agent-generated content
                response_data = {
                    "request_id": agent_response.request_id if hasattr(agent_response, 'request_id') else agent_response.get('request_id', f"PR_{datetime.now().strftime('%Y%m%d_%H%M%S')}"),
                    "company_name": pr_request.company_name,
                    "category": pr_request.category,
                    "generated_releases": sample_releases,
                    "timestamp": agent_response.timestamp if hasattr(agent_response, 'timestamp') else agent_response.get('timestamp', datetime.now().isoformat()),
                    "status": "completed"
                }
                
                print(f"✅ Using agent-generated content with {len(sample_releases)} press releases")
                
                return jsonify({
                    "success": True,
                    "data": response_data,
                    "message": f"Generated {len(response_data.get('generated_releases', []))} press releases successfully via AI agent"
                })
                
            except Exception as parse_error:
                print(f"⚠️ Failed to parse agent response: {parse_error}")
                print(f"⚠️ Falling back to local generation")
                # Fall through to local generation
        
        # Fallback to local generation if agent fails or is not configured
        print(f"⚠️ Using local generation (Agent available: {bool(AGENT_ADDRESS)}, Success: {success})")
        
        # Generate content locally using the same logic as the agent
        sample_releases = []
        db_requests = []  # Store database request objects
        
        # Ensure target_outlets is not None and has data
        target_outlets = pr_request.target_outlets or ['General']
        if not target_outlets:
            target_outlets = ['General']
        
        for outlet_name in target_outlets:
            # Find or create outlet in database
            try:
                outlet = NewsOutlet.query.filter_by(name=outlet_name).first()
                if not outlet:
                    outlet = NewsOutlet(name=outlet_name)
                    db.session.add(outlet)
                    db.session.flush()  # Get the ID
                
                # Create request record in database with user association
                db_request = Request(
                    title=pr_request.title or 'Untitled Press Release',
                    body=pr_request.body or 'No content provided',
                    news_outlet_id=outlet.id,
                    user_id=user_id,  # Associate with current user
                    company_name=pr_request.company_name or 'Unknown Company',
                    category=pr_request.category or 'Company Milestone',
                    contact_info=pr_request.contact_info or '',
                    additional_notes=pr_request.additional_notes or ''
                )
                db.session.add(db_request)
                db.session.flush()  # Get the ID
                db_requests.append(db_request)
                
            except Exception as db_error:
                print(f"⚠️ Database error for outlet {outlet_name}: {db_error}")
                # Continue without database storage for this outlet
                pass
            
            # Generate content based on outlet style (same as agent logic)
            try:
                content = generate_content_for_outlet(pr_request, outlet_name)
                if not content:
                    content = f"Press release content for {pr_request.company_name or 'Company'} - {pr_request.category or 'Announcement'}"
            except Exception as content_error:
                print(f"⚠️ Content generation error for {outlet_name}: {content_error}")
                content = f"Press release content for {pr_request.company_name or 'Company'} - {pr_request.category or 'Announcement'}"
            
            tone_map = {
                "TechCrunch": "Direct, tech-focused, startup-friendly",
                "The Verge": "Consumer-focused, accessible tech coverage", 
                "Forbes": "Business-focused, executive perspective",
                "General": "Balanced, broad appeal"
            }
            
            tone = tone_map.get(outlet_name, "Balanced, broad appeal")
            word_count = len(content.split()) if content else 0
            
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
    
    # Safety checks for None values
    title = pr_request.title or f"Press Release from {pr_request.company_name or 'Company'}"
    company_name = pr_request.company_name or "Company"
    body = pr_request.body or "No content provided"
    category = pr_request.category or "Company Milestone"
    additional_notes = pr_request.additional_notes or ""
    contact_info = pr_request.contact_info or ""
    
    if outlet == "TechCrunch":
        return f"""**{title}**

{company_name} today announced {body.lower()}

**Key Highlights:**
• Innovation-driven approach to market disruption
• Technology-first solution addressing key industry challenges  
• Positioned for rapid scaling and market adoption

**About the {category}:**
This development represents a significant milestone in {company_name}'s growth trajectory, demonstrating the company's commitment to pushing technological boundaries and delivering value to users.

**Market Impact:**
The announcement is expected to strengthen {company_name}'s position in the competitive landscape, potentially influencing industry standards and user expectations.

**Additional Information:**
{additional_notes if additional_notes else 'Further details will be available through official company channels.'}

**Contact:**
{contact_info if contact_info else 'Media inquiries welcome through standard channels.'}

*This release was optimized for TechCrunch's tech-focused, startup-friendly editorial style.*"""

    elif outlet == "The Verge":
        return f"""# {title}

{company_name} is making waves with {body.lower()}

## What This Means for Users

This {category.lower()} represents more than just another corporate announcement — it's about how technology continues to reshape our daily experiences and interactions.

## The Consumer Angle

For everyday users, this development translates to:
- Enhanced user experience and accessibility
- More intuitive interaction with technology
- Broader implications for digital lifestyle trends

## Company Perspective

"{body}" said representatives from {company_name}, emphasizing the consumer-first approach that drives their innovation strategy.

## Looking Forward

This announcement positions {company_name} at the intersection of technology and user experience, areas where The Verge's audience expects cutting-edge developments.

## Additional Context
{additional_notes if additional_notes else 'More details expected as the story develops.'}

**Media Contact:** {contact_info if contact_info else 'Available upon request'}

*Styled for The Verge's consumer-tech focus and engaging narrative approach.*"""

    elif outlet == "Forbes":
        return f"""**{title}**
*Strategic {category} Positions Company for Market Leadership*

**Executive Summary**

{company_name} today announced {body}, a strategic move that underscores the company's commitment to market expansion and shareholder value creation.

**Business Impact Analysis**

This {category.lower()} represents a calculated investment in:
- Market position strengthening
- Operational efficiency improvements  
- Long-term value creation for stakeholders
- Competitive advantage development

**Market Dynamics**

The timing of this announcement reflects {company_name}'s strategic response to evolving market conditions and positions the company to capitalize on emerging opportunities in their sector.

**Financial Implications**

Industry analysts expect this {category.lower()} to contribute positively to the company's growth trajectory, potentially impacting:
- Revenue generation capabilities
- Market share expansion
- Operational scalability
- Investment attractiveness

**Leadership Commentary**

The {category.lower()} aligns with {company_name}'s broader strategic vision and demonstrates executive leadership's commitment to sustainable growth and market innovation.

**Additional Strategic Context**
{additional_notes if additional_notes else 'Further strategic details to be disclosed in upcoming investor communications.'}

**Investor Relations Contact:** {contact_info if contact_info else 'Available through official investor relations channels'}

*Formatted for Forbes' business-executive audience with focus on market impact and financial implications.*"""

    else:  # General
        return f"""FOR IMMEDIATE RELEASE

**{title}**

{company_name} Announces {category}

**[City, Date]** – {company_name} today announced {body}

**About This {category}:**

This development represents an important milestone for {company_name} and demonstrates the organization's ongoing commitment to innovation and growth.

**Key Details:**

• **What:** {category} by {company_name}
• **Impact:** Enhanced capabilities and market position
• **Timeline:** Effective immediately
• **Scope:** Company-wide initiative

**Company Background:**

{company_name} continues to build on its foundation of innovation and customer service, with this {category.lower()} marking another step in the company's strategic evolution.

**Additional Information:**
{additional_notes if additional_notes else 'Additional details available upon request.'}

**Media Contact:**
{contact_info if contact_info else 'Media inquiries welcome'}

**About {company_name}:**
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
@require_auth
def get_requests():
    """Get all press release requests with their responses for the current user"""
    try:
        # Get current user
        user_id = request.current_user['user_id']
        
        # Filter requests by current user
        requests = Request.query.filter_by(user_id=user_id).order_by(Request.created_at.desc()).all()
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
        print(f"⚠️ Database error loading requests for user {user_id}: {e}")
        return jsonify({
            "success": False,
            "message": f"Error loading requests: {str(e)}"
        })

@app.route('/api/requests/<int:request_id>', methods=['GET'])
@require_auth
def get_request(request_id):
    """Get a specific request with its responses for the current user"""
    try:
        # Get current user
        user_id = request.current_user['user_id']
        
        # Find request and ensure it belongs to current user
        req = Request.query.filter_by(id=request_id, user_id=user_id).first()
        if not req:
            return jsonify({
                "success": False,
                "message": "Request not found or access denied"
            }), 404
        
        req_dict = req.to_dict()
        req_dict['responses'] = [resp.to_dict() for resp in req.responses]
        
        return jsonify({
            "success": True,
            "data": req_dict
        })
    except Exception as e:
        print(f"⚠️ Database error loading request {request_id} for user {user_id}: {e}")
        return jsonify({
            "success": False,
            "message": f"Error loading request: {str(e)}"
        })

@app.route('/api/requests/<int:request_id>', methods=['DELETE'])
@require_auth
def delete_request(request_id):
    """Delete a specific request and all its responses for the current user"""
    try:
        # Get current user
        user_id = request.current_user['user_id']
        
        # Find request and ensure it belongs to current user
        req = Request.query.filter_by(id=request_id, user_id=user_id).first()
        if not req:
            return jsonify({
                "success": False,
                "message": "Request not found or access denied"
            }), 404
        
        # Store info for response
        company_name = req.company_name
        title = req.title
        
        # Delete the request (responses will be automatically deleted due to cascade)
        db.session.delete(req)
        db.session.commit()
        
        print(f"🗑️ User {user_id} deleted request {request_id}: '{title}' by {company_name}")
        
        return jsonify({
            "success": True,
            "message": f"Successfully deleted request '{title}'"
        })
        
    except Exception as e:
        print(f"⚠️ Database error deleting request {request_id} for user {user_id}: {e}")
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": f"Error deleting request: {str(e)}"
        }), 500

@app.route('/api/init-db', methods=['POST'])
def init_database():
    """Initialize database tables (for development/setup)"""
    try:
        # Import the migration function
        from migrate_db import initialize_database_for_api
        
        # Run safe migration (doesn't drop existing tables)
        results = initialize_database_for_api(app)
        
        if results["success"]:
            return jsonify({
                "success": True,
                "message": results["message"],
                "data": {
                    "tables_created": results["tables_created"],
                    "outlets_added": results["outlets_added"],
                    "counts": results["counts"]
                }
            })
        else:
            return jsonify({
                "success": False,
                "message": results["message"]
            }), 500
            
    except Exception as e:
        print(f"💥 Database initialization error: {e}")
        return jsonify({
            "success": False,
            "message": f"Database initialization failed: {str(e)}"
        }), 500

@app.route('/api/auth/register', methods=['POST'])
def register_user():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['fullName', 'email', 'companyName', 'password', 'confirmPassword']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    "success": False,
                    "message": f"Field '{field}' is required"
                }), 400
        
        # Validate email format
        email = data.get('email').strip().lower()
        if '@' not in email:
            return jsonify({
                "success": False,
                "message": "Invalid email format"
            }), 400
        
        # Validate password confirmation
        if data.get('password') != data.get('confirmPassword'):
            return jsonify({
                "success": False,
                "message": "Passwords do not match"
            }), 400
        
        # Check password length
        if len(data.get('password')) < 6:
            return jsonify({
                "success": False,
                "message": "Password must be at least 6 characters long"
            }), 400
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({
                "success": False,
                "message": "User with this email already exists"
            }), 409
        
        # Create new user
        user = User(
            full_name=data.get('fullName').strip(),
            email=email,
            company_name=data.get('companyName').strip()
        )
        user.set_password(data.get('password'))
        
        db.session.add(user)
        db.session.commit()
        
        # Generate token
        token = generate_token(user.id, user.email)
        
        print(f"👤 New user registered: {user.email} ({user.company_name})")
        
        return jsonify({
            "success": True,
            "data": {
                "user": user.to_dict(),
                "token": token
            },
            "message": "User registered successfully"
        })
        
    except Exception as e:
        print(f"⚠️ Registration error: {e}")
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": f"Registration failed: {str(e)}"
        }), 500

@app.route('/api/auth/login', methods=['POST'])
def login_user():
    """Login user and return token"""
    try:
        data = request.get_json()
        
        # Validate required fields
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({
                "success": False,
                "message": "Email and password are required"
            }), 400
        
        # Find user
        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            return jsonify({
                "success": False,
                "message": "Invalid email or password"
            }), 401
        
        if not user.is_active:
            return jsonify({
                "success": False,
                "message": "Account is deactivated"
            }), 401
        
        # Generate token
        token = generate_token(user.id, user.email)
        
        print(f"🔐 User logged in: {user.email}")
        
        return jsonify({
            "success": True,
            "data": {
                "user": user.to_dict(),
                "token": token
            },
            "message": "Login successful"
        })
        
    except Exception as e:
        print(f"⚠️ Login error: {e}")
        return jsonify({
            "success": False,
            "message": f"Login failed: {str(e)}"
        }), 500

@app.route('/api/auth/profile', methods=['GET'])
@require_auth
def get_user_profile():
    """Get current user's profile"""
    try:
        user_id = request.current_user['user_id']
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404
        
        return jsonify({
            "success": True,
            "data": user.to_dict()
        })
        
    except Exception as e:
        print(f"⚠️ Profile fetch error: {e}")
        return jsonify({
            "success": False,
            "message": f"Failed to fetch profile: {str(e)}"
        }), 500

@app.route('/api/auth/profile', methods=['PUT'])
@require_auth
def update_user_profile():
    """Update current user's profile"""
    try:
        user_id = request.current_user['user_id']
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'fullName' in data:
            user.full_name = data['fullName'].strip()
        if 'companyName' in data:
            user.company_name = data['companyName'].strip()
        if 'phone' in data:
            user.phone = data['phone'].strip() if data['phone'] else None
        if 'location' in data:
            user.location = data['location'].strip() if data['location'] else None
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        print(f"📝 Profile updated for user: {user.email}")
        
        return jsonify({
            "success": True,
            "data": user.to_dict(),
            "message": "Profile updated successfully"
        })
        
    except Exception as e:
        print(f"⚠️ Profile update error: {e}")
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": f"Failed to update profile: {str(e)}"
        }), 500

@app.route('/api/auth/verify', methods=['GET'])
@require_auth
def verify_auth():
    """Verify if token is valid"""
    try:
        user_id = request.current_user['user_id']
        user = User.query.get(user_id)
        
        if not user or not user.is_active:
            return jsonify({
                "success": False,
                "message": "Invalid user"
            }), 401
        
        return jsonify({
            "success": True,
            "data": user.to_dict(),
            "message": "Token is valid"
        })
        
    except Exception as e:
        print(f"⚠️ Token verification error: {e}")
        return jsonify({
            "success": False,
            "message": "Token verification failed"
        }), 401

@app.route('/api/transcripts', methods=['POST'])
@require_auth
def save_transcript():
    """Save a new speech transcript for the current user"""
    try:
        # Get current user
        user_id = request.current_user['user_id']
        
        data = request.get_json()
        text = data.get('text', '').strip()
        
        if not text:
            return jsonify({
                "success": False,
                "message": "Transcript text is required"
            }), 400
        
        # Create new transcript associated with current user
        transcript = Transcript(
            text=text,
            user_id=user_id
        )
        db.session.add(transcript)
        db.session.commit()
        
        print(f"💾 User {user_id} saved transcript {transcript.id}: {len(text)} characters")
        
        return jsonify({
            "success": True,
            "data": transcript.to_dict(),
            "message": "Transcript saved successfully"
        })
        
    except Exception as e:
        print(f"⚠️ Database error saving transcript for user {user_id}: {e}")
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": f"Error saving transcript: {str(e)}"
        }), 500

@app.route('/api/transcripts', methods=['GET'])
@require_auth
def get_transcripts():
    """Get all saved transcripts for the current user"""
    try:
        # Get current user
        user_id = request.current_user['user_id']
        
        # Filter transcripts by current user
        transcripts = Transcript.query.filter_by(user_id=user_id).order_by(Transcript.created_at.desc()).all()
        transcript_data = [transcript.to_dict() for transcript in transcripts]
        
        return jsonify({
            "success": True,
            "data": transcript_data,
            "count": len(transcript_data)
        })
        
    except Exception as e:
        print(f"⚠️ Database error loading transcripts for user {user_id}: {e}")
        return jsonify({
            "success": False,
            "message": f"Error loading transcripts: {str(e)}"
        })

@app.route('/api/transcripts/<int:transcript_id>', methods=['GET'])
@require_auth
def get_transcript(transcript_id):
    """Get a specific transcript for the current user"""
    try:
        # Get current user
        user_id = request.current_user['user_id']
        
        # Find transcript and ensure it belongs to current user
        transcript = Transcript.query.filter_by(id=transcript_id, user_id=user_id).first()
        if not transcript:
            return jsonify({
                "success": False,
                "message": "Transcript not found or access denied"
            }), 404
        
        return jsonify({
            "success": True,
            "data": transcript.to_dict()
        })
        
    except Exception as e:
        print(f"⚠️ Database error loading transcript {transcript_id} for user {user_id}: {e}")
        return jsonify({
            "success": False,
            "message": f"Error loading transcript: {str(e)}"
        })

@app.route('/api/transcripts/<int:transcript_id>', methods=['DELETE'])
@require_auth
def delete_transcript(transcript_id):
    """Delete a specific transcript for the current user"""
    try:
        # Get current user
        user_id = request.current_user['user_id']
        
        # Find transcript and ensure it belongs to current user
        transcript = Transcript.query.filter_by(id=transcript_id, user_id=user_id).first()
        if not transcript:
            return jsonify({
                "success": False,
                "message": "Transcript not found or access denied"
            }), 404
        
        # Delete the transcript
        db.session.delete(transcript)
        db.session.commit()
        
        print(f"🗑️ User {user_id} deleted transcript {transcript_id}")
        
        return jsonify({
            "success": True,
            "message": "Transcript deleted successfully"
        })
        
    except Exception as e:
        print(f"⚠️ Database error deleting transcript {transcript_id} for user {user_id}: {e}")
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": f"Error deleting transcript: {str(e)}"
        }), 500

@app.route('/api/migrate-user-relations', methods=['POST'])
def migrate_user_relations_endpoint():
    """Run migration to add user relationships to existing tables"""
    try:
        # Import the migration function
        from migrate_user_relations import migrate_user_relations
        
        # Run the migration
        results = migrate_user_relations()
        
        if results["success"]:
            return jsonify({
                "success": True,
                "message": results["message"],
                "data": {
                    "changes_made": results["changes_made"]
                }
            })
        else:
            return jsonify({
                "success": False,
                "message": results["message"]
            }), 500
            
    except Exception as e:
        print(f"💥 User relations migration error: {e}")
        return jsonify({
            "success": False,
            "message": f"Migration failed: {str(e)}"
        }), 500

@app.route('/api/dashboard/stats', methods=['GET'])
@require_auth
def get_dashboard_stats():
    """Get dashboard statistics for the current user"""
    try:
        # Get current user
        user_id = request.current_user['user_id']
        
        # Get user's requests
        user_requests = Request.query.filter_by(user_id=user_id).all()
        
        # Calculate basic stats
        total_requests = len(user_requests)
        
        # For now, we'll consider all requests as completed since we generate them immediately
        # In a real system, you might have different status tracking
        completed_requests = total_requests
        active_requests = 0  # No active/pending system currently
        
        # Get unique outlets used by this user
        unique_outlets = set()
        for req in user_requests:
            if req.news_outlet and req.news_outlet.name:
                unique_outlets.add(req.news_outlet.name)
        
        # Get recent activity (last 5 requests)
        recent_requests = Request.query.filter_by(user_id=user_id)\
                                     .order_by(Request.created_at.desc())\
                                     .limit(5).all()
        
        recent_activity = []
        for req in recent_requests:
            # Get outlets for this request (check responses)
            outlets = []
            if req.responses:
                # In our system, we create one request per outlet, so get the outlet name
                if req.news_outlet:
                    outlets.append(req.news_outlet.name)
            
            # Calculate time ago
            import datetime
            time_diff = datetime.datetime.utcnow() - req.created_at
            if time_diff.days > 0:
                time_ago = f"{time_diff.days} day{'s' if time_diff.days > 1 else ''} ago"
            elif time_diff.seconds > 3600:
                hours = time_diff.seconds // 3600
                time_ago = f"{hours} hour{'s' if hours > 1 else ''} ago"
            elif time_diff.seconds > 60:
                minutes = time_diff.seconds // 60
                time_ago = f"{minutes} minute{'s' if minutes > 1 else ''} ago"
            else:
                time_ago = "Just now"
            
            recent_activity.append({
                'id': req.id,
                'type': 'press_release',
                'title': req.title,
                'status': 'completed',  # All our requests are completed immediately
                'outlets': outlets,
                'date': time_ago,
                'category': req.category
            })
        
        return jsonify({
            "success": True,
            "data": {
                "totalRequests": total_requests,
                "activeRequests": active_requests,
                "completedRequests": completed_requests,
                "totalOutlets": len(unique_outlets),
                "recentActivity": recent_activity
            }
        })
        
    except Exception as e:
        print(f"⚠️ Dashboard stats error for user {user_id}: {e}")
        return jsonify({
            "success": False,
            "message": f"Error loading dashboard stats: {str(e)}"
        }), 500

# Admin functionality
def require_admin(f):
    """Decorator to require admin authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # First check if user is authenticated
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                pass
        
        if not token:
            return jsonify({'message': 'Authentication token required'}), 401
        
        payload = verify_token(token)
        if not payload:
            return jsonify({'message': 'Invalid or expired token'}), 401
        
        # Check if user is admin
        user = User.query.get(payload['user_id'])
        if not user or not getattr(user, 'is_admin', False):
            return jsonify({'message': 'Admin access required'}), 403
        
        request.current_user = payload
        return f(*args, **kwargs)
    
    return decorated_function

@app.route('/api/admin/create', methods=['POST'])
def create_admin():
    """Create admin user - public endpoint for initial setup"""
    try:
        # Check if admin already exists
        existing_admin = User.query.filter_by(email='admin@admin.com').first()
        if existing_admin:
            # Update existing user to be admin
            existing_admin.is_admin = True
            db.session.commit()
            return jsonify({
                "success": True,
                "message": "Existing user updated to admin",
                "data": {
                    "email": "admin@admin.com"
                }
            })
        
        # Create admin user
        admin_user = User(
            full_name='System Administrator',
            email='admin@admin.com',
            company_name='PR-Connect Admin',
            is_admin=True
        )
        admin_user.set_password('admin')
        
        db.session.add(admin_user)
        db.session.commit()
        
        print("👑 Admin user created successfully")
        
        return jsonify({
            "success": True,
            "message": "Admin user created successfully",
            "data": {
                "email": "admin@admin.com",
                "password": "admin"
            }
        })
        
    except Exception as e:
        print(f"⚠️ Admin creation error: {e}")
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": f"Error creating admin: {str(e)}"
        }), 500

@app.route('/api/admin/requests', methods=['GET'])
@require_admin  
def admin_get_all_requests():
    """Get all requests from all users with newspaper history - Admin only"""
    try:
        # Query all requests with related data
        requests = Request.query.options(
            db.joinedload(Request.user),
            db.joinedload(Request.news_outlet),
            db.joinedload(Request.responses)
        ).order_by(Request.created_at.desc()).all()
        
        requests_data = []
        for req in requests:
            request_data = req.to_dict()
            # Add response count
            request_data['response_count'] = len(req.responses)
            # Add responses data
            request_data['responses'] = [resp.to_dict() for resp in req.responses]
            # Add newspaper/outlet info
            request_data['newspaper'] = req.news_outlet.name if req.news_outlet else 'Unknown'
            request_data['outlet_info'] = req.news_outlet.to_dict() if req.news_outlet else None
            requests_data.append(request_data)
        
        return jsonify({
            "success": True,
            "data": {
                "requests": requests_data,
                "total": len(requests_data)
            }
        })
        
    except Exception as e:
        print(f"⚠️ Admin requests list error: {e}")
        return jsonify({
            "success": False,
            "message": f"Error loading requests: {str(e)}"
        }), 500

@app.route('/api/admin/users', methods=['GET'])
@require_admin
def admin_get_users():
    """Get all users with their newspaper usage - Admin only"""
    try:
        users = User.query.all()
        users_data = []
        
        for user in users:
            user_data = user.to_dict()
            # Add stats
            user_requests = Request.query.filter_by(user_id=user.id).all()
            user_data['total_requests'] = len(user_requests)
            user_data['total_transcripts'] = Transcript.query.filter_by(user_id=user.id).count()
            
            # Get newspaper usage for this user
            newspaper_usage = {}
            for req in user_requests:
                if req.news_outlet:
                    outlet_name = req.news_outlet.name
                    if outlet_name in newspaper_usage:
                        newspaper_usage[outlet_name] += 1
                    else:
                        newspaper_usage[outlet_name] = 1
            
            user_data['newspaper_usage'] = newspaper_usage
            user_data['newspapers_used'] = list(newspaper_usage.keys())
            users_data.append(user_data)
        
        return jsonify({
            "success": True,
            "data": users_data
        })
        
    except Exception as e:
        print(f"⚠️ Admin users list error: {e}")
        return jsonify({
            "success": False,
            "message": f"Error loading users: {str(e)}"
        }), 500

@app.route('/api/admin/stats', methods=['GET'])
@require_admin
def admin_get_stats():
    """Get overall platform statistics with newspaper analytics - Admin only"""
    try:
        # Get counts
        total_users = User.query.count()
        total_requests = Request.query.count()
        total_responses = Response.query.count()
        total_transcripts = Transcript.query.count()
        
        # Get outlet usage stats (newspaper analytics)
        outlet_stats = db.session.query(
            NewsOutlet.name,
            db.func.count(Request.id).label('count')
        ).join(Request).group_by(NewsOutlet.name).all()
        
        # Get category stats
        category_stats = db.session.query(
            Request.category,
            db.func.count(Request.id).label('count')
        ).filter(Request.category.isnot(None)).group_by(Request.category).all()
        
        # Get recent activity (last 20 requests across all users)
        recent_requests = Request.query.options(
            db.joinedload(Request.user),
            db.joinedload(Request.news_outlet)
        ).order_by(Request.created_at.desc()).limit(20).all()
        
        recent_activity = []
        for req in recent_requests:
            recent_activity.append({
                'id': req.id,
                'title': req.title,
                'user_name': req.user.full_name if req.user else 'Unknown',
                'user_email': req.user.email if req.user else 'Unknown',
                'company': req.company_name,
                'newspaper': req.news_outlet.name if req.news_outlet else 'Unknown',
                'outlet': req.news_outlet.name if req.news_outlet else 'Unknown',
                'category': req.category,
                'created_at': req.created_at.isoformat() if req.created_at else None
            })
        
        # Get user stats with newspaper breakdown
        user_newspaper_stats = []
        users = User.query.all()
        for user in users:
            user_requests = Request.query.filter_by(user_id=user.id).all()
            newspaper_breakdown = {}
            for req in user_requests:
                if req.news_outlet:
                    outlet_name = req.news_outlet.name
                    newspaper_breakdown[outlet_name] = newspaper_breakdown.get(outlet_name, 0) + 1
            
            if user_requests:  # Only include users who have made requests
                user_newspaper_stats.append({
                    'user_name': user.full_name,
                    'user_email': user.email,
                    'company': user.company_name,
                    'total_requests': len(user_requests),
                    'newspaper_breakdown': newspaper_breakdown
                })
        
        return jsonify({
            "success": True,
            "data": {
                "overview": {
                    "total_users": total_users,
                    "total_requests": total_requests, 
                    "total_responses": total_responses,
                    "total_transcripts": total_transcripts
                },
                "outlet_stats": [{"name": name, "count": count} for name, count in outlet_stats],
                "category_stats": [{"name": category, "count": count} for category, count in category_stats],
                "recent_activity": recent_activity,
                "user_newspaper_stats": user_newspaper_stats
            }
        })
        
    except Exception as e:
        print(f"⚠️ Admin stats error: {e}")
        return jsonify({
            "success": False,
            "message": f"Error loading stats: {str(e)}"
        }), 500

@app.route('/api/admin/newspapers', methods=['GET'])
@require_admin
def admin_get_newspaper_analytics():
    """Get detailed newspaper/outlet analytics - Admin only"""
    try:
        # Get all outlets with usage data
        outlets_with_usage = db.session.query(
            NewsOutlet.id,
            NewsOutlet.name,
            db.func.count(Request.id).label('total_usage'),
            db.func.count(db.distinct(Request.user_id)).label('unique_users')
        ).outerjoin(Request).group_by(NewsOutlet.id, NewsOutlet.name).all()
        
        newspaper_analytics = []
        for outlet_id, outlet_name, total_usage, unique_users in outlets_with_usage:
            # Get recent requests for this outlet
            recent_requests = Request.query.filter_by(news_outlet_id=outlet_id)\
                                         .options(db.joinedload(Request.user))\
                                         .order_by(Request.created_at.desc())\
                                         .limit(5).all()
            
            recent_activity = []
            for req in recent_requests:
                recent_activity.append({
                    'id': req.id,
                    'title': req.title,
                    'user_name': req.user.full_name if req.user else 'Unknown',
                    'company': req.company_name,
                    'date': req.created_at.isoformat() if req.created_at else None
                })
            
            newspaper_analytics.append({
                'outlet_id': outlet_id,
                'outlet_name': outlet_name,
                'total_usage': total_usage or 0,
                'unique_users': unique_users or 0,
                'recent_activity': recent_activity
            })
        
        # Sort by usage
        newspaper_analytics.sort(key=lambda x: x['total_usage'], reverse=True)
        
        return jsonify({
            "success": True,
            "data": {
                "newspaper_analytics": newspaper_analytics,
                "total_outlets": len(newspaper_analytics)
            }
        })
        
    except Exception as e:
        print(f"⚠️ Admin newspaper analytics error: {e}")
        return jsonify({
            "success": False,
            "message": f"Error loading newspaper analytics: {str(e)}"
        }), 500

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
            # Import the migration function
            from migrate_db import initialize_database_for_api
            
            # Run safe migration (doesn't drop existing tables)
            results = initialize_database_for_api(app)
            
            if results["success"]:
                print("✅ Database tables created/verified")
                print(f"📊 Table counts: {results['counts']}")
                if results["outlets_added"]:
                    print(f"📰 Added {len(results['outlets_added'])} new outlets: {', '.join(results['outlets_added'])}")
                print("🗄️ PostgreSQL database connected successfully!")
            else:
                print(f"⚠️ Database initialization warning: {results['message']}")
                print("📝 App will continue with existing database state")
        except Exception as e:
            print(f"⚠️ Database connection/initialization failed: {e}")
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
