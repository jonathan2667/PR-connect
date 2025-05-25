"""
Press Release Generation Agent - AI-powered PR content creation
Handles client requests and generates tailored press releases for different media outlets using DeepSeek AI
"""

from uagents import Agent, Context, Model
from typing import List, Optional
from datetime import datetime
from openai import OpenAI
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

# Initialize OpenAI client for OpenRouter
client = None
if API_KEY_DS:
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=API_KEY_DS,
    )

# Outlet-specific styles and instructions for AI
OUTLET_STYLES = {
    "TechCrunch": {
        "tone": "Direct, tech-focused, startup-friendly",
        "style": "Bold headlines, focus on innovation and market disruption",
        "instructions": "Write a professional press release in TechCrunch style: tech-focused, startup-friendly, emphasize innovation and market disruption. Use markdown formatting with bold headings (##) and bullet points. Target 300-500 words. Focus on technical achievements and business impact."
    },
    "The Verge": {
        "tone": "Consumer-focused, accessible tech coverage",
        "style": "Engaging, lifestyle-oriented tech angle",
        "instructions": "Write a professional press release in The Verge style: consumer-focused, accessible tech coverage with engaging narrative. Use markdown formatting with clear headings (##) and focus on human aspects of technology. Target 400-600 words. Make it engaging and relatable."
    },
    "Forbes": {
        "tone": "Business-focused, executive perspective",
        "style": "Professional, market impact, financial implications",
        "instructions": "Write a professional press release in Forbes style: business-focused, executive perspective, emphasize market impact and financial implications. Use markdown formatting with professional headings (##). Target 500-800 words. Focus on business strategy and market positioning."
    },
    "General": {
        "tone": "Balanced, broad appeal",
        "style": "Standard press release format, accessible to all audiences",
        "instructions": "Write a professional press release in standard format: balanced tone, broad appeal, accessible to all audiences. Use markdown formatting with clear headings (##) and bullet points. Follow traditional PR structure with headline, dateline, body paragraphs, and contact info. Target 400-600 words."
    },
    "Adevarul": {
        "tone": "Romanian news perspective, factual reporting",
        "style": "Straightforward news reporting, local angle",
        "instructions": "Write a professional press release in Romanian news style: factual reporting, straightforward news format with local perspective. Use markdown formatting with clear headings (##). Target 300-500 words. Objective and informative tone."
    },
    "CNN": {
        "tone": "News-focused, broad appeal",
        "style": "Breaking news format, impact-focused",
        "instructions": "Write a professional press release in CNN news style: breaking news format, broad appeal, focus on impact and implications. Use markdown formatting with bold headings (##). Target 400-600 words. Clear, authoritative reporting tone."
    }
}

async def generate_ai_press_release(request: PressReleaseRequest, outlet: str, ctx: Context) -> GeneratedPressRelease:
    """Generate press release using DeepSeek AI via OpenRouter with OpenAI client"""
    
    if not client:
        ctx.logger.error("❌ OpenAI client not initialized - API key missing")
        return create_fallback_release(request, outlet)
    
    outlet_info = OUTLET_STYLES.get(outlet, OUTLET_STYLES["General"])
    
    # Create the prompt for DeepSeek with strict JSON-only response requirements
    prompt = f"""You are a professional press release writer. Generate content for {outlet} based on the following information:

COMPANY: {request.company_name}
TITLE: {request.title}
CATEGORY: {request.category}
CONTENT: {request.body}
CONTACT: {request.contact_info}
NOTES: {request.additional_notes}

Writing Style: {outlet_info['instructions']}

CRITICAL INSTRUCTIONS:
- Respond with ONLY a valid JSON object
- No text before or after the JSON
- No explanations, comments, or markdown formatting
- No code blocks or backticks
- Ensure the content is in markdown format within the JSON

Required JSON structure:
{{
    "content": "YOUR_MARKDOWN_FORMATTED_PRESS_RELEASE_HERE",
    "tone": "{outlet_info['tone']}"
}}

Start your response immediately with the opening curly brace {{"""

    try:
        ctx.logger.info(f"🤖 Calling DeepSeek AI for {outlet}...")
        
        completion = client.chat.completions.create(
            extra_headers={
                "HTTP-Referer": "https://pr-connect-r40k.onrender.com",
                "X-Title": "PR-Connect",
            },
            data=json.dumps({
                "model": "deepseek/deepseek-r1-zero:free",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a professional press release writer. You MUST respond with ONLY valid JSON. No explanations, no code blocks, no additional text. Start your response immediately with { and end with }."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "max_tokens": 2000,
                "temperature": 0.3,
                "top_p": 0.9,
                "response_format": {"type": "json_object"} if "deepseek" in "deepseek/deepseek-r1-zero:free" else None
            })
        )
        
        if response.status_code == 200:
            ai_response = response.json()
            content_text = ai_response['choices'][0]['message']['content'].strip()
            
            # Clean up the response to extract only the JSON part
            try:
                # Remove any potential markdown code blocks
                if content_text.startswith('```'):
                    lines = content_text.split('\n')
                    # Find first line that starts with {
                    start_idx = 0
                    for i, line in enumerate(lines):
                        if line.strip().startswith('{'):
                            start_idx = i
                            break
                    # Find last line that ends with }
                    end_idx = len(lines) - 1
                    for i in range(len(lines) - 1, -1, -1):
                        if lines[i].strip().endswith('}'):
                            end_idx = i
                            break
                    content_text = '\n'.join(lines[start_idx:end_idx + 1])
                
                # Find the JSON object boundaries
                start_brace = content_text.find('{')
                if start_brace != -1:
                    # Find the matching closing brace
                    brace_count = 0
                    end_brace = -1
                    for i in range(start_brace, len(content_text)):
                        if content_text[i] == '{':
                            brace_count += 1
                        elif content_text[i] == '}':
                            brace_count -= 1
                            if brace_count == 0:
                                end_brace = i
                                break
                    
                    if end_brace != -1:
                        json_text = content_text[start_brace:end_brace + 1]
                        parsed_content = json.loads(json_text)
                        content = parsed_content.get('content', '')
                        tone = parsed_content.get('tone', outlet_info['tone'])
                        
                        # Validate that we got meaningful content
                        if not content or len(content.strip()) < 50:
                            raise ValueError("Generated content too short or empty")
                            
                    else:
                        raise ValueError("No complete JSON object found")
                else:
                    raise ValueError("No JSON object found in response")
                    
            except (json.JSONDecodeError, ValueError, KeyError) as e:
                ctx.logger.warning(f"Failed to parse AI JSON response for {outlet}: {str(e)}")
                ctx.logger.warning(f"Raw AI response: {content_text[:200]}...")
                # Use fallback content generation
                content = f"""# {request.title}

**{request.company_name}** announces {request.category.lower()}.

## Overview

{request.body}

## Key Highlights

• Significant development in {request.category.lower()}
• Strategic advancement for {request.company_name}
• Enhanced capabilities and market position

## About {request.company_name}

{request.company_name} continues to innovate and deliver value to its stakeholders through strategic initiatives and market-leading solutions.

## Contact Information

{request.contact_info if request.contact_info else f'For more information about {request.company_name}, please contact our media relations team.'}

---
*This press release was generated for {outlet} distribution.*"""
                tone = outlet_info['tone']
            
            word_count = len(content.split())
            ctx.logger.info(f"✅ AI generated {outlet} content: {word_count} words")
            
            return GeneratedPressRelease(
                outlet=outlet,
                content=content,
                tone=outlet_info['tone'],
                word_count=word_count
            )
        else:
            ctx.logger.error(f"❌ Empty response from AI for {outlet}")
            return create_fallback_release(request, outlet)
            
    except Exception as e:
        ctx.logger.error(f"❌ Error calling AI for {outlet}: {str(e)}")
        return create_fallback_release(request, outlet)

def create_fallback_release(request: PressReleaseRequest, outlet: str) -> GeneratedPressRelease:
    """Create fallback content when AI fails"""
    outlet_info = OUTLET_STYLES.get(outlet, OUTLET_STYLES["General"])
    
    fallback_content = f"""# {request.title}

**{request.company_name}** announces {request.category.lower()}.

## Overview

{request.body}

## Key Highlights

- Innovative approach to industry challenges
- Strategic positioning for market growth
- Commitment to excellence and quality delivery

## About {request.company_name}

{request.company_name} continues to focus on innovation and excellence, delivering value to customers and stakeholders.

## Contact Information

**Contact:** {request.contact_info if request.contact_info else f'For more information, contact {request.company_name}'}

{f"**Additional Notes:** {request.additional_notes}" if request.additional_notes else ""}

*This press release was generated for {outlet} - {outlet_info['tone']}*"""
    
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