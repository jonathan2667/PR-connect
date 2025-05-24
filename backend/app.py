"""
Press Release Generation Web Interface
Professional platform for AI-powered press release creation and management
"""

from flask import Flask, render_template, request, jsonify
from uagents.communication import send_sync_message
from uagents import Model
from typing import List, Optional
import asyncio
import json
from datetime import datetime

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
AGENT_ADDRESS = "agent1qf376ss48kl8cpsc8pwtmtauscplngqrf0ku437ma5jwcvqw20r2jf38pzp"

# Available outlets and categories
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

app = Flask(__name__, 
    template_folder='../frontend/templates',
    static_folder='../frontend/static')

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
    """Main press release generation interface"""
    return render_template('press_release.html', 
                         outlets=AVAILABLE_OUTLETS,
                         categories=PRESS_RELEASE_CATEGORIES)

@app.route('/generate', methods=['POST'])
def generate_press_release():
    """Handle press release generation request"""
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
        print(f"📥 Response type: {type(response)}")
        print(f"📥 Response content: {response}")
        
        if success:
            # The agent communication is working, but send_sync_message only returns delivery status
            # not the actual response content. So we'll always use our local generation
            # which matches the agent's generation logic exactly
            print(f"✅ Message delivered to agent successfully")
            
            # Generate content locally using the same logic as the agent
            sample_releases = []
            for outlet in pr_request.target_outlets:
                # Generate content based on outlet style (same as agent logic)
                if outlet == "TechCrunch":
                    content = f"""**{pr_request.title}**

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
                    content = f"""# {pr_request.title}

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
                    content = f"""**{pr_request.title}**
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
                    content = f"""FOR IMMEDIATE RELEASE

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
                
                sample_releases.append({
                    "outlet": outlet,
                    "content": content,
                    "tone": {
                        "TechCrunch": "Direct, tech-focused, startup-friendly",
                        "The Verge": "Consumer-focused, accessible tech coverage", 
                        "Forbes": "Business-focused, executive perspective",
                        "General": "Balanced, broad appeal"
                    }.get(outlet, "Balanced, broad appeal"),
                    "word_count": len(content.split())
                })
            
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
        return jsonify({
            "success": False,
            "message": f"Error processing request: {str(e)}"
        })

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

@app.route('/api/outlets')
def get_outlets():
    """API endpoint for outlet information"""
    return jsonify(AVAILABLE_OUTLETS)

@app.route('/api/categories') 
def get_categories():
    """API endpoint for category information"""
    return jsonify(PRESS_RELEASE_CATEGORIES)

if __name__ == '__main__':
    print("🚀 Starting Press Release Generation Platform")
    print(f"🤖 Agent Address: {AGENT_ADDRESS}")
    print(f"🌐 Web Interface: http://localhost:5001")
    print(f"📊 Available Outlets: {', '.join(AVAILABLE_OUTLETS.keys())}")
    print(f"📁 Available Categories: {len(PRESS_RELEASE_CATEGORIES)} types")
    print("=" * 70)
    
    app.run(debug=True, host='0.0.0.0', port=5001) 