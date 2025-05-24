"""
Press Release Generation Agent - AI-powered PR content creation
Handles client requests and generates tailored press releases for different media outlets
"""

from uagents import Agent, Context, Model
from typing import List, Optional
from datetime import datetime

# Define message models for Press Release workflow
class PressReleaseRequest(Model):
    title: str
    body: str
    company_name: str
    target_outlets: List[str]  # e.g., ["TechCrunch", "The Verge", "Forbes", "General"]
    category: str  # e.g., "Product Launch", "Acquisition", "Funding", "Event"
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

agent = Agent()

# Outlet-specific templates and styles
OUTLET_STYLES = {
    "TechCrunch": {
        "tone": "Direct, tech-focused, startup-friendly",
        "style": "Bold headlines, focus on innovation and market disruption",
        "typical_length": "300-500 words"
    },
    "The Verge": {
        "tone": "Consumer-focused, accessible tech coverage",
        "style": "Engaging, lifestyle-oriented tech angle",
        "typical_length": "400-600 words"
    },
    "Forbes": {
        "tone": "Business-focused, executive perspective",
        "style": "Professional, market impact, financial implications",
        "typical_length": "500-800 words"
    },
    "General": {
        "tone": "Balanced, broad appeal",
        "style": "Standard press release format, accessible to all audiences",
        "typical_length": "400-600 words"
    }
}

def generate_press_release_content(request: PressReleaseRequest, outlet: str) -> GeneratedPressRelease:
    """Generate outlet-specific press release content"""
    
    outlet_style = OUTLET_STYLES.get(outlet, OUTLET_STYLES["General"])
    
    # Generate outlet-specific content
    if outlet == "TechCrunch":
        content = generate_techcrunch_style(request)
    elif outlet == "The Verge":
        content = generate_theverge_style(request)
    elif outlet == "Forbes":
        content = generate_forbes_style(request)
    else:
        content = generate_general_style(request)
    
    return GeneratedPressRelease(
        outlet=outlet,
        content=content,
        tone=outlet_style["tone"],
        word_count=len(content.split())
    )

def generate_techcrunch_style(request: PressReleaseRequest) -> str:
    """Generate TechCrunch-style press release"""
    return f"""**{request.title}**

{request.company_name} today announced {request.body.lower()}

**Key Highlights:**
• Innovation-driven approach to market disruption
• Technology-first solution addressing key industry challenges  
• Positioned for rapid scaling and market adoption

**About the {request.category}:**
This development represents a significant milestone in {request.company_name}'s growth trajectory, demonstrating the company's commitment to pushing technological boundaries and delivering value to users.

**Market Impact:**
The announcement is expected to strengthen {request.company_name}'s position in the competitive landscape, potentially influencing industry standards and user expectations.

**Additional Information:**
{request.additional_notes if request.additional_notes else 'Further details will be available through official company channels.'}

**Contact:**
{request.contact_info if request.contact_info else 'Media inquiries welcome through standard channels.'}

*This release was optimized for TechCrunch's tech-focused, startup-friendly editorial style.*"""

def generate_theverge_style(request: PressReleaseRequest) -> str:
    """Generate The Verge-style press release"""
    return f"""# {request.title}

{request.company_name} is making waves with {request.body.lower()}

## What This Means for Users

This {request.category.lower()} represents more than just another corporate announcement — it's about how technology continues to reshape our daily experiences and interactions.

## The Consumer Angle

For everyday users, this development translates to:
- Enhanced user experience and accessibility
- More intuitive interaction with technology
- Broader implications for digital lifestyle trends

## Company Perspective

"{request.body}" said representatives from {request.company_name}, emphasizing the consumer-first approach that drives their innovation strategy.

## Looking Forward

This announcement positions {request.company_name} at the intersection of technology and user experience, areas where The Verge's audience expects cutting-edge developments.

## Additional Context
{request.additional_notes if request.additional_notes else 'More details expected as the story develops.'}

**Media Contact:** {request.contact_info if request.contact_info else 'Available upon request'}

*Styled for The Verge's consumer-tech focus and engaging narrative approach.*"""

def generate_forbes_style(request: PressReleaseRequest) -> str:
    """Generate Forbes-style press release"""
    return f"""**{request.title}**
*Strategic {request.category} Positions Company for Market Leadership*

**Executive Summary**

{request.company_name} today announced {request.body}, a strategic move that underscores the company's commitment to market expansion and shareholder value creation.

**Business Impact Analysis**

This {request.category.lower()} represents a calculated investment in:
- Market position strengthening
- Operational efficiency improvements  
- Long-term value creation for stakeholders
- Competitive advantage development

**Market Dynamics**

The timing of this announcement reflects {request.company_name}'s strategic response to evolving market conditions and positions the company to capitalize on emerging opportunities in their sector.

**Financial Implications**

Industry analysts expect this {request.category.lower()} to contribute positively to the company's growth trajectory, potentially impacting:
- Revenue generation capabilities
- Market share expansion
- Operational scalability
- Investment attractiveness

**Leadership Commentary**

The {request.category.lower()} aligns with {request.company_name}'s broader strategic vision and demonstrates executive leadership's commitment to sustainable growth and market innovation.

**Additional Strategic Context**
{request.additional_notes if request.additional_notes else 'Further strategic details to be disclosed in upcoming investor communications.'}

**Investor Relations Contact:** {request.contact_info if request.contact_info else 'Available through official investor relations channels'}

*Formatted for Forbes' business-executive audience with focus on market impact and financial implications.*"""

def generate_general_style(request: PressReleaseRequest) -> str:
    """Generate general audience press release"""
    return f"""FOR IMMEDIATE RELEASE

**{request.title}**

{request.company_name} Announces {request.category}

**[City, Date]** – {request.company_name} today announced {request.body}

**About This {request.category}:**

This development represents an important milestone for {request.company_name} and demonstrates the organization's ongoing commitment to innovation and growth.

**Key Details:**

• **What:** {request.category} by {request.company_name}
• **Impact:** Enhanced capabilities and market position
• **Timeline:** Effective immediately
• **Scope:** Company-wide initiative

**Company Background:**

{request.company_name} continues to build on its foundation of innovation and customer service, with this {request.category.lower()} marking another step in the company's strategic evolution.

**Additional Information:**
{request.additional_notes if request.additional_notes else 'Additional details available upon request.'}

**Media Contact:**
{request.contact_info if request.contact_info else 'Media inquiries welcome'}

**About {request.company_name}:**
[Standard company boilerplate would appear here]

###

*This press release follows standard industry formatting for broad media distribution.*"""

@agent.on_event("startup")
async def startup_message(ctx: Context):
    """Agent startup notification"""
    ctx.logger.info(f"🎯 Press Release Generation Agent Online")
    ctx.logger.info(f"📧 Agent Address: {ctx.agent.address}")
    ctx.logger.info(f"🏢 Ready to generate tailored press releases for multiple outlets")

@agent.on_message(model=PressReleaseRequest)
async def handle_press_release_request(ctx: Context, sender: str, msg: PressReleaseRequest):
    """Process press release generation requests"""
    ctx.logger.info(f"📝 New press release request from {sender}")
    ctx.logger.info(f"🏢 Company: {msg.company_name}")
    ctx.logger.info(f"📊 Category: {msg.category}")
    ctx.logger.info(f"🎯 Target outlets: {', '.join(msg.target_outlets)}")
    
    # Generate press releases for each requested outlet
    generated_releases = []
    
    for outlet in msg.target_outlets:
        ctx.logger.info(f"✍️ Generating {outlet} version...")
        release = generate_press_release_content(msg, outlet)
        generated_releases.append(release)
        ctx.logger.info(f"✅ {outlet} version complete ({release.word_count} words)")
    
    # Create response with all generated content
    response = PressReleaseResponse(
        request_id=f"PR_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        company_name=msg.company_name,
        category=msg.category,
        generated_releases=generated_releases,
        timestamp=datetime.now().isoformat(),
        status="completed"
    )
    
    ctx.logger.info(f"📤 Sending {len(generated_releases)} generated press releases back to {sender}")
    
    # Send the generated press releases back
    await ctx.send(sender, response)

if __name__ == "__main__":
    agent.run() 