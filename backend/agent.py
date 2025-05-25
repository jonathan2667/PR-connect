"""
Press Release Generation Agent - AI-powered PR content creation
Handles client requests and generates tailored press releases for different media outlets using DeepSeek AI
"""

from uagents import Agent, Context, Model
from typing import List, Optional
from datetime import datetime
import requests
import json
import os

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

# Get DeepSeek API key from environment
API_KEY_DS = os.getenv('API_KEY_DS')

# Outlet-specific styles and instructions for AI
OUTLET_STYLES = {
    "TechCrunch": {
        "tone": "Direct, tech-focused, startup-friendly",
        "style": "Bold headlines, focus on innovation and market disruption",
        "instructions": "Write in TechCrunch style: tech-focused, startup-friendly, emphasize innovation and market disruption. Use bold headings and bullet points. Target 300-500 words."
    },
    "The Verge": {
        "tone": "Consumer-focused, accessible tech coverage",
        "style": "Engaging, lifestyle-oriented tech angle",
        "instructions": "Write in The Verge style: consumer-focused, accessible tech coverage with engaging narrative. Focus on human aspects of technology. Target 400-600 words."
    },
    "Forbes": {
        "tone": "Business-focused, executive perspective",
        "style": "Professional, market impact, financial implications",
        "instructions": "Write in Forbes style: business-focused, executive perspective, emphasize market impact and financial implications. Professional tone for business leaders. Target 500-800 words."
    },
    "General": {
        "tone": "Balanced, broad appeal",
        "style": "Standard press release format, accessible to all audiences",
        "instructions": "Write in standard press release format: balanced tone, broad appeal, accessible to all audiences. Follow traditional PR structure. Target 400-600 words."
    },
    "Adevarul": {
        "tone": "Romanian news perspective, factual reporting",
        "style": "Straightforward news reporting, local angle",
        "instructions": "Write in Romanian news style: factual reporting, straightforward news format with local perspective. Objective and informative. Target 300-500 words."
    },
    "CNN": {
        "tone": "News-focused, broad appeal",
        "style": "Breaking news format, impact-focused",
        "instructions": "Write in CNN news style: breaking news format, broad appeal, focus on impact and implications. Clear, authoritative reporting tone. Target 400-600 words."
    }
}

async def generate_ai_press_release(request: PressReleaseRequest, outlet: str, ctx: Context) -> GeneratedPressRelease:
    """Generate press release using DeepSeek AI via OpenRouter"""
    
    outlet_info = OUTLET_STYLES.get(outlet, OUTLET_STYLES["General"])
    
    # Create the prompt for DeepSeek
    prompt = f"""You are a professional press release writer. Create a press release in markdown format for {outlet}.

Company: {request.company_name}
Title: {request.title}
Category: {request.category}
Content: {request.body}
Contact Info: {request.contact_info}
Additional Notes: {request.additional_notes}

Style Requirements: {outlet_info['instructions']}

IMPORTANT: Return ONLY a JSON object with this exact structure:
{{
    "content": "THE_MARKDOWN_CONTENT_HERE",
    "tone": "{outlet_info['tone']}"
}}

Do not include any other text, explanations, or formatting outside the JSON object."""

    try:
        # Call OpenRouter API with DeepSeek model
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {API_KEY_DS}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://pr-connect-r40k.onrender.com",
                "X-Title": "PR-Connect",
            },
            data=json.dumps({
                "model": "deepseek/deepseek-r1-zero:free",
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "max_tokens": 2000,
                "temperature": 0.7
            })
        )
        
        if response.status_code == 200:
            ai_response = response.json()
            content_text = ai_response['choices'][0]['message']['content']
            
            # Try to parse the JSON response from AI
            try:
                parsed_content = json.loads(content_text)
                content = parsed_content.get('content', content_text)
                tone = parsed_content.get('tone', outlet_info['tone'])
            except json.JSONDecodeError:
                # If AI didn't return proper JSON, use the raw content
                content = content_text
                tone = outlet_info['tone']
                ctx.logger.warning(f"AI didn't return proper JSON for {outlet}, using raw content")
            
            word_count = len(content.split())
            ctx.logger.info(f"✅ AI generated {outlet} content: {word_count} words")
            
            return GeneratedPressRelease(
                outlet=outlet,
                content=content,
                tone=tone,
                word_count=word_count
            )
        else:
            ctx.logger.error(f"❌ OpenRouter API error for {outlet}: {response.status_code}")
            # Fallback content
            fallback_content = f"""# {request.title}

{request.company_name} announces {request.category.lower()}.

## Details

{request.body}

**Contact Information:**
{request.contact_info if request.contact_info else f'For more information, contact {request.company_name}'}

*Generated content - API temporarily unavailable*"""
            
            return GeneratedPressRelease(
                outlet=outlet,
                content=fallback_content,
                tone=outlet_info['tone'],
                word_count=len(fallback_content.split())
            )
            
    except Exception as e:
        ctx.logger.error(f"❌ Error generating content for {outlet}: {str(e)}")
        # Fallback content
        fallback_content = f"""# {request.title}

{request.company_name} announces {request.category.lower()}.

## Details

{request.body}

**Contact Information:**
{request.contact_info if request.contact_info else f'For more information, contact {request.company_name}'}

*Generated content - Error occurred during AI generation*"""
        
        return GeneratedPressRelease(
            outlet=outlet,
            content=fallback_content,
            tone=outlet_info['tone'],
            word_count=len(fallback_content.split())
        )

@agent.on_event("startup")
async def startup_message(ctx: Context):
    """Agent startup notification"""
    ctx.logger.info(f"🎯 Press Release Generation Agent Online (AI-Powered)")
    ctx.logger.info(f"📧 Agent Address: {ctx.agent.address}")
    ctx.logger.info(f"🤖 Using DeepSeek AI via OpenRouter")
    ctx.logger.info(f"🔑 API Key Status: {'✅ Configured' if API_KEY_DS else '❌ Missing'}")
    ctx.logger.info(f"🏢 Ready to generate AI-powered press releases for multiple outlets")

@agent.on_message(model=PressReleaseRequest)
async def handle_press_release_request(ctx: Context, sender: str, msg: PressReleaseRequest):
    """Process press release generation requests using AI"""
    ctx.logger.info(f"📝 New AI press release request from {sender}")
    ctx.logger.info(f"🏢 Company: {msg.company_name}")
    ctx.logger.info(f"📊 Category: {msg.category}")
    ctx.logger.info(f"🎯 Target outlets: {', '.join(msg.target_outlets)}")
    
    if not API_KEY_DS:
        ctx.logger.error("❌ API_KEY_DS not configured!")
        # Send error response
        error_response = PressReleaseResponse(
            request_id=f"PR_ERROR_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            company_name=msg.company_name,
            category=msg.category,
            generated_releases=[],
            timestamp=datetime.now().isoformat(),
            status="error: API key not configured"
        )
        await ctx.send(sender, error_response)
        return
    
    # Generate press releases for each requested outlet using AI
    generated_releases = []
    
    for outlet in msg.target_outlets:
        ctx.logger.info(f"🤖 Generating AI-powered {outlet} version...")
        release = await generate_ai_press_release(msg, outlet, ctx)
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
    
    ctx.logger.info(f"📤 Sending {len(generated_releases)} AI-generated press releases back to {sender}")
    
    # Send the generated press releases back
    await ctx.send(sender, response)

if __name__ == "__main__":
    agent.run()