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
import requests

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

def clean_press_release_content(content: str) -> str:
    """Clean and format press release content from AI response"""
    # Remove LaTeX formatting
    content = content.replace('\\boxed{', '').replace('}', '')
    
    # Remove code block markers if present
    if content.startswith('```'):
        lines = content.split('\n')
        # Find first content line after opening ```
        start_idx = 1
        for i, line in enumerate(lines[1:], 1):
            if not line.strip().startswith('```') and line.strip():
                start_idx = i
                break
        # Find last content line before closing ```
        end_idx = len(lines)
        for i in range(len(lines) - 1, -1, -1):
            if not lines[i].strip().startswith('```') and lines[i].strip():
                end_idx = i + 1
                break
        content = '\n'.join(lines[start_idx:end_idx])
    
    # Remove any remaining markdown code block indicators
    content = content.replace('```markdown', '').replace('```', '')
    
    # Clean up excessive whitespace while preserving paragraph breaks
    lines = content.split('\n')
    cleaned_lines = []
    for line in lines:
        cleaned_line = line.strip()
        cleaned_lines.append(cleaned_line)
    
    # Join lines and clean up excessive line breaks
    content = '\n'.join(cleaned_lines)
    # Replace multiple consecutive empty lines with maximum 2
    while '\n\n\n' in content:
        content = content.replace('\n\n\n', '\n\n')
    
    return content.strip()

async def generate_ai_press_release(request: PressReleaseRequest, outlet: str, ctx: Context) -> GeneratedPressRelease:
    """Generate press release using DeepSeek AI via OpenRouter with OpenAI client"""
    
    if not client:
        ctx.logger.error("❌ OpenAI client not initialized - API key missing")
        return create_fallback_release(request, outlet)
    
    outlet_info = OUTLET_STYLES.get(outlet, OUTLET_STYLES["General"])
    
    # Create the prompt for DeepSeek with direct content generation
    prompt = f"""You are a professional press release writer. Write a press release in markdown format for {outlet}.

Company: {request.company_name}
Title: {request.title}
Category: {request.category}
Content: {request.body}
Contact Info: {request.contact_info}
Additional Notes: {request.additional_notes}

Writing Style: {outlet_info['instructions']}

Generate a professional press release in markdown format. Include proper headings, bullet points, and formatting appropriate for {outlet}. Write directly in markdown - no JSON, no code blocks, just the press release content."""

    try:
        ctx.logger.info(f"🤖 Calling DeepSeek AI for {outlet}...")
        
        # Check API key first
        if not API_KEY_DS:
            ctx.logger.error(f"❌ API_KEY_DS not set for {outlet}")
            return create_fallback_release(request, outlet)
        
        # Log the request structure for debugging (without exposing the API key)
        request_data = {
            "model": "deepseek/deepseek-r1-zero:free",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a professional press release writer. Generate well-formatted markdown press releases. Write directly in markdown format - no JSON, no code blocks, no explanations."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": 2000,
            "temperature": 0.3,
            "top_p": 0.9
        }
        
        ctx.logger.info(f"📡 API Request structure: model={request_data['model']}, messages_count={len(request_data['messages'])}")
        
        # Call OpenRouter API with DeepSeek model
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {API_KEY_DS}",
                "HTTP-Referer": "https://pr-connect-r40k.onrender.com",
                "X-Title": "PR-Connect",
            },
            json=request_data,  # Use json= instead of data=json.dumps() to set Content-Type automatically
            timeout=30  # Add 30 second timeout
        )
        
        ctx.logger.info(f"📊 API Response Status: {response.status_code}")
        
        if response.status_code == 200:
            ai_response = response.json()
            ctx.logger.info(f"📦 Full API Response Structure: {list(ai_response.keys())}")
            
            if 'choices' in ai_response and len(ai_response['choices']) > 0:
                content_text = ai_response['choices'][0]['message']['content'].strip()
                ctx.logger.info(f"🤖 Raw AI Response: {content_text[:300]}...")
                
                # Clean the content
                cleaned_content = clean_press_release_content(content_text)
                
                # Use the cleaned content directly - no need to parse JSON
                content = cleaned_content
                tone = outlet_info['tone']
                
                # Validate that we got meaningful content
                if content and len(content.strip()) > 50:
                    word_count = len(content.split())
                    ctx.logger.info(f"✅ AI generated {outlet} content: {word_count} words")
                    ctx.logger.info(f"🎭 Using tone: {tone}")
                    ctx.logger.info(f"📄 Content preview: {content[:150]}...")
                    ctx.logger.info(f"🚀 SUCCESS: Using AI-generated content for {outlet}")
                    
                    return GeneratedPressRelease(
                        outlet=outlet,
                        content=content,
                        tone=tone,
                        word_count=word_count
                    )
                else:
                    ctx.logger.warning(f"⚠️ Content too short: {len(content)} chars")
                    return create_fallback_release(request, outlet)
            else:
                ctx.logger.error(f"❌ No choices in API response: {ai_response}")
                return create_fallback_release(request, outlet)
        else:
            ctx.logger.error(f"❌ API Error for {outlet}: Status {response.status_code}")
            try:
                error_response = response.json()
                ctx.logger.error(f"❌ API Error Details: {error_response}")
            except:
                ctx.logger.error(f"❌ API Raw Response: {response.text}")
            return create_fallback_release(request, outlet)
            
    except requests.exceptions.Timeout:
        ctx.logger.error(f"⏰ API Timeout for {outlet}: DeepSeek API took longer than 30 seconds")
        return create_fallback_release(request, outlet)
    except requests.exceptions.ConnectionError:
        ctx.logger.error(f"🌐 Connection Error for {outlet}: Cannot reach OpenRouter API")
        return create_fallback_release(request, outlet)
    except requests.exceptions.RequestException as e:
        ctx.logger.error(f"🔌 Network Error for {outlet}: {str(e)}")
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
    
    print(f"⚠️ WARNING: Using fallback template content for {outlet} (not AI-generated)")
    print(f"📄 Fallback content preview: {fallback_content[:150]}...")
    
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