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
    
    # Transform the body content rather than just echoing it
    if "launch" in request.body.lower():
        announcement = f"unveiled its latest innovation with the {request.title.lower()}"
    elif "funding" in request.body.lower() or "investment" in request.body.lower():
        announcement = f"secured significant funding to accelerate development of {request.title.lower()}"
    elif "partnership" in request.body.lower():
        announcement = f"formed a strategic partnership to enhance {request.title.lower()}"
    else:
        announcement = f"made a major announcement regarding {request.title.lower()}"
    
    return f"""**{request.title}**

{request.company_name} today {announcement}, marking a significant milestone in the company's evolution within the tech ecosystem.

**Key Highlights:**
• Revolutionary approach combining cutting-edge technology with market-driven solutions
• Scalable architecture designed for rapid user adoption and growth
• Positioned to disrupt traditional industry practices and create new market opportunities
• Built with developer-first mindset and enterprise-grade security

**Technical Innovation:**
This {request.category.lower()} represents {request.company_name}'s commitment to pushing the boundaries of what's possible in technology. The solution addresses critical pain points in the market while maintaining the flexibility and performance that modern businesses demand.

**Market Impact:**
Industry analysts expect this development to significantly impact how companies approach their technology stack, potentially setting new standards for innovation and user experience in the sector.

**What Makes This Different:**
Unlike existing solutions, {request.company_name}'s approach focuses on seamless integration, intuitive user experience, and scalable performance that grows with business needs.

**Additional Information:**
{request.additional_notes if request.additional_notes else 'Technical documentation and developer resources will be made available through the company portal.'}

**Media Contact:**
{request.contact_info if request.contact_info else f'Press inquiries: press@{request.company_name.lower().replace(" ", "")}.com'}

*This release reflects TechCrunch's focus on innovation, disruption, and the technical aspects that matter to the startup ecosystem.*"""

def generate_theverge_style(request: PressReleaseRequest) -> str:
    """Generate The Verge-style press release"""
    
    # Create more engaging, consumer-focused content
    consumer_angle = ""
    if "app" in request.body.lower() or "platform" in request.body.lower():
        consumer_angle = "a new way for users to interact with technology"
    elif "service" in request.body.lower():
        consumer_angle = "an enhanced service experience"
    elif "product" in request.body.lower():
        consumer_angle = "a product that could change how we think about everyday technology"
    else:
        consumer_angle = "an innovation that bridges technology and human experience"
    
    return f"""# {request.title}

{request.company_name} is introducing {consumer_angle}, and it's exactly the kind of forward-thinking approach we've come to expect from companies that understand where technology is heading.

## What This Means for You

This {request.category.lower()} isn't just another corporate announcement — it's about the evolving relationship between technology and daily life. When companies like {request.company_name} make moves like this, it signals broader shifts in how we'll interact with digital tools in the future.

## The User Experience Focus

The real story here is user experience. {request.company_name} seems to understand that great technology isn't just about features — it's about creating seamless, intuitive experiences that actually improve how people work and live.

## Why This Matters Now

In a landscape where users are increasingly demanding more from their technology, {request.company_name}'s approach represents a thoughtful response to real user needs. This {request.category.lower()} addresses the gap between what technology can do and what users actually want it to do.

## The Bigger Picture

This development positions {request.company_name} in an interesting space where technology meets practical application. It's the kind of strategic thinking that often leads to meaningful innovation rather than just incremental updates.

## Looking Ahead

As the technology landscape continues to evolve, announcements like this remind us that the companies succeeding aren't just building better technology — they're building better experiences.

## Additional Context
{request.additional_notes if request.additional_notes else "We'll be following this story as it develops and tracking user response to the new offerings."}

**Press Contact:** {request.contact_info if request.contact_info else "Media inquiries welcomed via official channels"}

*Written in The Verge's signature style: consumer-focused, forward-looking, and emphasizing the human side of technology.*"""

def generate_forbes_style(request: PressReleaseRequest) -> str:
    """Generate Forbes-style press release"""
    
    # Create business-focused, strategic content
    strategic_context = ""
    if "funding" in request.body.lower():
        strategic_context = "capital allocation strategy"
    elif "launch" in request.body.lower():
        strategic_context = "market expansion initiative"
    elif "partnership" in request.body.lower():
        strategic_context = "strategic alliance formation"
    else:
        strategic_context = "business development strategy"
    
    return f"""**{request.title}**
*{request.company_name} Advances Market Position Through Strategic {request.category}*

**Executive Summary**

{request.company_name} today unveiled its latest {strategic_context}, a calculated move that underscores the company's commitment to sustainable growth and market leadership in an increasingly competitive landscape.

**Strategic Business Impact**

This {request.category.lower()} represents a sophisticated approach to:
• Market position consolidation and expansion opportunities
• Operational efficiency optimization across key business verticals
• Long-term shareholder value creation through strategic asset development
• Competitive differentiation in a rapidly evolving marketplace

**Market Analysis**

The timing of this announcement reflects {request.company_name}'s strategic intelligence in recognizing market inflection points. Industry experts suggest this {request.category.lower()} positions the company to capitalize on emerging market opportunities while mitigating sector-specific risks.

**Financial and Operational Implications**

From an investment perspective, this development demonstrates:
• Strong management execution of previously outlined strategic objectives
• Prudent resource allocation supporting both growth and profitability metrics
• Enhanced market positioning that should drive sustainable revenue growth
• Operational scalability improvements supporting long-term expansion goals

**Leadership Perspective**

The {request.category.lower()} aligns with {request.company_name}'s articulated vision for sustainable growth and market innovation. This strategic initiative reflects the kind of forward-thinking leadership that institutional investors value in today's dynamic business environment.

**Competitive Landscape Impact**

By executing this {request.category.lower()}, {request.company_name} strengthens its competitive moat while creating new avenues for market expansion. The move signals confidence in the company's ability to execute complex strategic initiatives while maintaining operational excellence.

**Investment Considerations**
{request.additional_notes if request.additional_notes else 'Detailed financial implications and strategic metrics will be discussed in upcoming investor communications and quarterly reporting.'}

**Investor Relations:** {request.contact_info if request.contact_info else f'investor.relations@{request.company_name.lower().replace(" ", "")}.com'}

*Structured for Forbes' executive readership with emphasis on strategic thinking, market impact, and investment implications.*"""

def generate_general_style(request: PressReleaseRequest) -> str:
    """Generate general audience press release"""
    
    # Create clear, accessible content for broad distribution
    return f"""FOR IMMEDIATE RELEASE

**{request.title}**

{request.company_name} Announces Significant {request.category}

**[City, State] – [Date]** – {request.company_name}, a leading organization in its field, today announced a major {request.category.lower()} that represents an important step forward in the company's ongoing mission to deliver innovative solutions and exceptional value.

**About This Development:**

This {request.category.lower()} demonstrates {request.company_name}'s continued commitment to innovation, growth, and excellence in serving its stakeholders. The initiative builds on the company's established track record of successful market execution and strategic development.

**Key Highlights:**

• **Innovation Focus:** Continued investment in cutting-edge solutions and market-leading capabilities
• **Market Impact:** Strengthened position to serve evolving customer needs and market demands  
• **Growth Strategy:** Strategic advancement supporting both immediate and long-term business objectives
• **Stakeholder Value:** Enhanced capabilities benefiting customers, partners, and the broader community

**Company Leadership Commentary:**

"{request.company_name} is pleased to announce this {request.category.lower()}, which represents our ongoing commitment to innovation and excellence," said company representatives. "This development reflects our strategic vision and our dedication to delivering meaningful value to all our stakeholders."

**About {request.company_name}:**

{request.company_name} continues to build on its foundation of innovation, quality, and customer service. The company remains focused on delivering solutions that meet evolving market needs while maintaining the highest standards of excellence and integrity.

**Additional Information:**
{request.additional_notes if request.additional_notes else 'Additional details about this announcement are available through official company communications channels.'}

**Media Contact:**
{request.contact_info if request.contact_info else f'Press inquiries: press@{request.company_name.lower().replace(" ", "")}.com'}

###

*This press release follows Associated Press style guidelines for broad media distribution and general audience accessibility.*"""

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