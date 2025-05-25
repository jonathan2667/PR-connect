"""
Press Release Generation Agent - AI-powered PR content creation
Handles client requests and generates tailored press releases for different media outlets
"""

from uagents import Agent, Context, Model
from typing import List, Optional
from datetime import datetime
import re

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

# Instantiate agent with consistent seed to get same address every time
agent = Agent(
    name="press_release_agent",
    seed="press-release-seed-phrase"
)

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
    },
    "Adevarul": {
        "tone": "Romanian news perspective, factual reporting",
        "style": "Straightforward news reporting, local angle",
        "typical_length": "300-500 words"
    },
    "CNN": {
        "tone": "News-focused, broad appeal",
        "style": "Breaking news format, impact-focused",
        "typical_length": "400-600 words"
    }
}

def analyze_content(content: str) -> dict:
    """Analyze the input content to extract meaningful information"""
    analysis = {
        "key_people": [],
        "projects": [],
        "locations": [],
        "activities": [],
        "sentiments": [],
        "main_themes": []
    }
    
    # Extract key information from content
    content_lower = content.lower()
    
    # Find people mentioned
    people_patterns = [
        r"i'm (\w+)",
        r"this is (\w+)",
        r"hello.*?(\w+)",
        r"(\w+) did a",
        r"with (\w+)"
    ]
    
    for pattern in people_patterns:
        matches = re.findall(pattern, content_lower)
        for match in matches:
            if match not in ['a', 'the', 'and', 'or', 'but', 'with', 'at', 'in', 'on']:
                analysis["key_people"].append(match.capitalize())
    
    # Find project/work mentions
    project_keywords = ["project", "presentation", "program", "work", "working", "hackathon", "development"]
    for keyword in project_keywords:
        if keyword in content_lower:
            analysis["activities"].append(keyword)
    
    # Find locations
    location_patterns = [
        r"at the (\w+)",
        r"at (\w+)",
    ]
    
    for pattern in location_patterns:
        matches = re.findall(pattern, content_lower)
        for match in matches:
            if len(match) > 2:  # Avoid short words
                analysis["locations"].append(match.capitalize())
    
    # Detect sentiment/atmosphere
    positive_words = ["enjoy", "like", "well", "good", "nice", "active", "going well"]
    for word in positive_words:
        if word in content_lower:
            analysis["sentiments"].append("positive")
            break
    
    # Main themes
    if "transcript" in content_lower:
        analysis["main_themes"].append("documentation")
    if "presentation" in content_lower:
        analysis["main_themes"].append("presentation")
    if "project" in content_lower:
        analysis["main_themes"].append("project_development")
    if "hackathon" in content_lower or "heaton" in content_lower:
        analysis["main_themes"].append("hackathon_event")
    
    return analysis

def generate_press_release_content(request: PressReleaseRequest, outlet: str) -> GeneratedPressRelease:
    """Generate outlet-specific press release content"""
    
    outlet_style = OUTLET_STYLES.get(outlet, OUTLET_STYLES["General"])
    
    # Analyze the content to understand what actually happened
    content_analysis = analyze_content(request.body)
    
    # Generate outlet-specific content
    if outlet == "TechCrunch" or outlet == "TTechCrunch":
        content = generate_techcrunch_style(request, content_analysis)
    elif outlet == "The Verge":
        content = generate_theverge_style(request, content_analysis)
    elif outlet == "Forbes":
        content = generate_forbes_style(request, content_analysis)
    elif outlet == "Adevarul":
        content = generate_adevarul_style(request, content_analysis)
    elif outlet == "CNN":
        content = generate_cnn_style(request, content_analysis)
    else:
        content = generate_general_style(request, content_analysis)
    
    return GeneratedPressRelease(
        outlet=outlet,
        content=content,
        tone=outlet_style["tone"],
        word_count=len(content.split())
    )

def generate_techcrunch_style(request: PressReleaseRequest, analysis: dict) -> str:
    """Generate TechCrunch-style press release"""
    
    # Extract key info
    people = analysis.get("key_people", [])
    locations = analysis.get("locations", [])
    activities = analysis.get("activities", [])
    
    # Create a tech-focused narrative
    people_str = " and ".join(people[:2]) if people else "The development team"
    location_str = f" at {locations[0]}" if locations else ""
    
    if "hackathon" in analysis.get("main_themes", []):
        context = "hackathon development environment"
        focus = "rapid prototyping and innovative solution development"
    elif "presentation" in analysis.get("main_themes", []):
        context = "presentation and demonstration phase"
        focus = "showcasing technical capabilities and project outcomes"
    else:
        context = "collaborative development session"
        focus = "team coordination and project advancement"
    
    return f"""**{request.title}**

{request.company_name} emerges from {context}{location_str}, where {people_str} demonstrated significant progress in their latest development initiative, marking a pivotal moment in the project's technical evolution.

**Development Highlights:**
• **Collaborative Innovation:** Cross-functional team coordination driving rapid iteration cycles
• **Real-time Progress:** Active development sessions yielding immediate, measurable outcomes
• **Technical Excellence:** Focus on {focus} throughout the development process
• **Scalable Framework:** Building foundation for sustained innovation and growth

**Team Dynamics & Innovation:**
The development sessions showcase {request.company_name}'s commitment to fostering an environment where {people_str} can push technical boundaries while maintaining collaborative efficiency. This approach reflects modern development practices that prioritize both innovation and execution.

**Technical Architecture:**
What sets this project apart is its emphasis on practical implementation alongside theoretical innovation. The team's ability to maintain momentum while ensuring quality deliverables demonstrates the kind of technical leadership that drives successful product development.

**Market Position:**
This {request.category.lower()} positions {request.company_name} within the competitive landscape of companies that understand the importance of combining technical excellence with effective team collaboration.

**Development Environment Impact:**
The positive team dynamics and productive atmosphere noted during these sessions indicate a sustainable development culture that can scale with the company's growth objectives.

**Next Steps:**
Building on this momentum, {request.company_name} is positioned to accelerate development cycles while maintaining the collaborative excellence that has characterized the project thus far.

**Additional Information:**
{request.additional_notes if request.additional_notes else 'Technical documentation and project updates will be shared through appropriate development channels.'}

**Media Contact:**
{request.contact_info if request.contact_info else f'Development inquiries: dev@{request.company_name.lower().replace(" ", "")}.com'}

*Reflecting TechCrunch's focus on development culture, technical innovation, and the startup ecosystem dynamics that drive successful projects.*"""

def generate_adevarul_style(request: PressReleaseRequest, analysis: dict) -> str:
    """Generate Adevarul (Romanian news) style press release"""
    
    people = analysis.get("key_people", [])
    locations = analysis.get("locations", [])
    
    people_str = " și ".join(people[:2]) if people else "Echipa de dezvoltare"
    location_str = f" la {locations[0]}" if locations else ""
    
    return f"""**{request.title}**
*{request.company_name} Anunță Progres Semnificativ în Dezvoltarea Proiectului*

**București, România** – {request.company_name} a raportat progrese importante în cadrul unui {request.category.lower()}, unde {people_str} au demonstrat rezultate concrete{location_str}.

**Detalii despre Dezvoltare:**

Sesiunile de lucru documentate arată un proces de dezvoltare activ și bine coordonat, cu echipa concentrându-se pe livrarea de rezultate concrete și măsurabile.

**Aspecte Cheie:**
• **Colaborare Eficientă:** Coordonare optimă între membrii echipei pentru atingerea obiectivelor
• **Progres Documentat:** Înregistrarea sistematică a progresului pentru transparență și urmărire
• **Atmosferă Pozitivă:** Mediu de lucru care favorizează creativitatea și productivitatea
• **Rezultate Concrete:** Livrarea de rezultate tangibile în cadrul timeframe-ului stabilit

**Context și Impact:**

Această inițiativă demonstrează capacitatea {request.company_name} de a gestiona proiecte complexe într-un mod organizat și eficient. Documentarea detaliată a procesului oferă transparență și permite urmărirea progresului în timp real.

**Declarații din Partea Echipei:**

Atmosfera pozitivă și rezultatele concrete obținute în cadrul sesiunilor de lucru reflectă angajamentul echipei față de excelența în execuție și colaborarea efectivă.

**Perspective de Viitor:**

Pe baza progresului înregistrat, {request.company_name} este pozționată pentru a continua dezvoltarea proiectului cu aceeași eficiență și calitate demonstrată până acum.

**Informații Suplimentare:**
{request.additional_notes if request.additional_notes else 'Detalii suplimentare despre proiect vor fi comunicate prin canalele oficiale ale companiei.'}

**Contact Media:**
{request.contact_info if request.contact_info else f'Întrebări media: presa@{request.company_name.lower().replace(" ", "")}.ro'}

*Știre redactată conform standardelor jurnalistice Adevărul, cu accent pe fapte concrete și transparență informațională.*"""

def generate_cnn_style(request: PressReleaseRequest, analysis: dict) -> str:
    """Generate CNN-style press release"""
    
    people = analysis.get("key_people", [])
    locations = analysis.get("locations", [])
    
    people_str = " and ".join(people[:2]) if people else "Development team members"
    location_str = f" at {locations[0]}" if locations else ""
    
    return f"""**BREAKING: {request.title}**

({datetime.now().strftime('%B %d, %Y')}) -- {request.company_name} reported significant progress in their latest {request.category.lower()}, with {people_str} documenting active development sessions{location_str} that showcase collaborative innovation in action.

**What We Know:**

Multiple development sessions have been documented, revealing a systematic approach to project advancement with real-time progress tracking and team coordination.

**Key Developments:**
• **Active Collaboration:** Teams working together to achieve concrete project milestones
• **Documented Progress:** Systematic recording of development activities for transparency
• **Positive Outcomes:** Successful completion of presentation phases and project demonstrations
• **Continued Momentum:** Ongoing activities that suggest sustained project development

**The Bigger Picture:**

This announcement comes as companies across industries are focusing on improved collaboration and systematic project management. The documented success of {request.company_name}'s approach offers insights into effective team coordination and project execution.

**Impact Assessment:**

The positive atmosphere and concrete results reported from these sessions suggest a sustainable development model that could influence how similar projects are managed in the future.

**What's Next:**

{request.company_name} appears positioned to build on this momentum, with the documented success providing a foundation for continued project advancement and team collaboration.

**Company Response:**

The systematic documentation and positive outcomes from these development sessions reflect {request.company_name}'s commitment to transparency and effective project management practices.

**Context and Analysis:**

This development highlights the importance of collaborative environments in achieving project success, with the documented approach providing a model for effective team coordination and outcome delivery.

**Additional Information:**
{request.additional_notes if request.additional_notes else 'Further details about the project development will be shared as they become available.'}

**Contact Information:**
{request.contact_info if request.contact_info else f'News inquiries: news@{request.company_name.lower().replace(" ", "")}.com'}

*This story reflects CNN's commitment to breaking news coverage and comprehensive analysis of developing business stories.*"""

def generate_theverge_style(request: PressReleaseRequest, analysis: dict) -> str:
    """Generate The Verge-style press release"""
    
    people = analysis.get("key_people", [])
    activities = analysis.get("activities", [])
    
    people_str = " and ".join(people[:2]) if people else "the team"
    
    return f"""# {request.title}

There's something refreshing about watching a project come together in real time, and that's exactly what's happening with {request.company_name}'s latest {request.category.lower()}.

## The Human Side of Development

What caught our attention isn't just the technical progress — it's how {people_str} are documenting the entire process. In an era where development often happens behind closed doors, this level of transparency offers a rare glimpse into how collaborative innovation actually works.

## Why Documentation Matters

The systematic recording of development sessions isn't just good practice; it's becoming essential for teams that want to understand their own processes. {request.company_name} seems to get this, treating documentation not as overhead but as a core part of their development culture.

## The Collaboration Factor

What emerges from these documented sessions is a picture of effective collaboration. When {people_str} can work together productively while maintaining positive team dynamics, it usually means the underlying systems and culture are working correctly.

## Real-Time Results

The immediate outcomes from these development sessions suggest something that many organizations struggle with: the ability to maintain momentum while ensuring quality. It's the kind of balanced approach that often separates successful projects from those that get stuck in planning phases.

## Looking at the Bigger Picture

This {request.category.lower()} represents more than just project progress — it's an example of how modern teams can leverage documentation, collaboration, and systematic approaches to achieve concrete results.

## What This Means Going Forward

For {request.company_name}, this documented success provides a foundation for scaling their approach. For the broader community, it offers insights into what effective collaboration actually looks like in practice.

## The Bottom Line

Sometimes the most innovative thing you can do is execute well on the fundamentals. That appears to be exactly what's happening here.

**Additional Context:**
{request.additional_notes if request.additional_notes else "We'll continue following this story as the project develops and more details become available."}

**Contact:** {request.contact_info if request.contact_info else "Media inquiries welcomed through official channels"}

*Written in The Verge's signature style: focusing on the human elements of technology and the cultural aspects of innovation.*"""

def generate_forbes_style(request: PressReleaseRequest, analysis: dict) -> str:
    """Generate Forbes-style press release"""
    
    return f"""**{request.title}**
*{request.company_name} Demonstrates Strategic Execution Through Systematic {request.category}*

**Executive Analysis**

{request.company_name} has reported substantive progress in their latest {request.category.lower()}, demonstrating the kind of systematic execution and documentation practices that distinguish high-performing organizations from their competitors.

**Strategic Framework**

The documented development sessions reveal several key strategic capabilities:
• **Process Optimization:** Systematic approach to project management and team coordination
• **Transparency Leadership:** Proactive documentation creating accountability and tracking mechanisms
• **Collaborative Excellence:** Cross-functional team effectiveness driving measurable outcomes
• **Execution Discipline:** Sustained momentum through structured development practices

**Organizational Effectiveness**

What emerges from these documented sessions is evidence of mature organizational processes. The ability to maintain productive team dynamics while delivering concrete results suggests operational excellence at multiple levels.

**Market Positioning Implications**

This systematic approach to project development positions {request.company_name} favorably within competitive markets where execution capability often determines success. Organizations that can document, replicate, and scale successful collaboration models typically outperform those relying on ad-hoc approaches.

**Leadership and Culture Assessment**

The positive atmosphere and concrete outcomes reported from these sessions reflect leadership practices that prioritize both results and team effectiveness. This combination is increasingly recognized as essential for sustainable organizational growth.

**Competitive Advantage Analysis**

The documented success of this {request.category.lower()} suggests {request.company_name} has developed replicable processes for managing complex initiatives. This operational capability represents a strategic asset that can be leveraged across multiple projects and market opportunities.

**Investment Perspective**

From an investor standpoint, systematic execution and transparent documentation indicate organizational maturity and scalable operational practices. These characteristics often correlate with sustained performance and reduced execution risk.

**Strategic Outlook**

Building on this documented success, {request.company_name} appears well-positioned to scale their proven approach across expanded project portfolios while maintaining the collaborative excellence that characterizes their current operations.

**Additional Strategic Context:**
{request.additional_notes if request.additional_notes else 'Detailed operational metrics and strategic implications will be communicated through appropriate business channels.'}

**Executive Contact:**
{request.contact_info if request.contact_info else f'Business inquiries: executive@{request.company_name.lower().replace(" ", "")}.com'}

*Structured for Forbes' executive readership with emphasis on strategic thinking, operational excellence, and competitive positioning.*"""

def generate_general_style(request: PressReleaseRequest, analysis: dict) -> str:
    """Generate general audience press release"""
    
    people = analysis.get("key_people", [])
    locations = analysis.get("locations", [])
    
    people_str = " and ".join(people[:2]) if people else "team members"
    location_str = f" at {locations[0]}" if locations else ""
    
    return f"""FOR IMMEDIATE RELEASE

**{request.title}**

{request.company_name} Reports Successful Progress in {request.category}

**[City, Date]** – {request.company_name} announced significant advancement in their latest {request.category.lower()}, with {people_str} documenting productive development sessions{location_str} that demonstrate effective collaboration and concrete results.

**Project Development Highlights:**

The documented sessions reveal a systematic approach to project management, featuring active collaboration, positive team dynamics, and measurable progress toward established objectives.

**Key Achievements:**
• **Effective Collaboration:** Team members working together productively to achieve project goals
• **Documented Progress:** Systematic recording of development activities for transparency and tracking
• **Positive Outcomes:** Successful completion of project presentations and demonstrations
• **Sustained Momentum:** Ongoing activities indicating continued project advancement

**Company Statement:**

The positive atmosphere and concrete results from these development sessions reflect {request.company_name}'s commitment to collaborative excellence and systematic project execution.

**Project Impact:**

This {request.category.lower()} demonstrates {request.company_name}'s ability to manage complex initiatives while maintaining effective team coordination and delivering measurable outcomes.

**About the Development Process:**

The systematic documentation of these sessions provides valuable insights into effective project management practices, showcasing how collaborative approaches can drive successful project outcomes.

**Future Outlook:**

Based on the documented success of these initial phases, {request.company_name} is well-positioned to continue building on this momentum while maintaining the high standards of collaboration and execution that have characterized the project thus far.

**About {request.company_name}:**

{request.company_name} continues to focus on collaborative innovation and systematic project execution, building on proven approaches that deliver concrete results while fostering positive team dynamics.

**Additional Information:**
{request.additional_notes if request.additional_notes else 'Further details about this project development will be shared through official company communications.'}

**Media Contact:**
{request.contact_info if request.contact_info else f'Press inquiries: media@{request.company_name.lower().replace(" ", "")}.com'}

###

*This press release follows standard industry formatting for broad media distribution and general audience accessibility.*"""

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