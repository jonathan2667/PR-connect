"""
Test script to verify communication with AgentVerse agent
"""

import asyncio
from uagents.communication import send_sync_message
from agent import PressReleaseRequest
import traceback

async def test_agent_communication():
    """Test direct communication with the AgentVerse agent"""
    
    # Configuration - Update with your agent address  
    AGENT_ADDRESS = "agent1qgdyle9ucwtgutmyj9xwydlkkswvu9mgwhkaxfg3hkn3usu3wjceg2u2r05"
    
    # Create a simple test request
    test_request = PressReleaseRequest(
        title="Test Press Release for Agent Communication",
        body="This is a test to verify that our agent communication is working correctly",
        company_name="Test Company",
        target_outlets=["TechCrunch", "General"],
        category="Product Launch",
        contact_info="test@company.com",
        additional_notes="This is a communication test"
    )
    
    print("🧪 AGENT COMMUNICATION TEST")
    print("=" * 50)
    print(f"🎯 Target Agent: {AGENT_ADDRESS}")
    print(f"📋 Test Request:")
    print(f"   Title: {test_request.title}")
    print(f"   Company: {test_request.company_name}")
    print(f"   Outlets: {test_request.target_outlets}")
    print(f"   Category: {test_request.category}")
    print()
    
    try:
        print("🔗 Attempting to connect to AgentVerse agent...")
        print("📡 Sending test message...")
        
        # Send the test request
        response = await send_sync_message(
            destination=AGENT_ADDRESS,
            message=test_request,
            timeout=30
        )
        
        print("✅ SUCCESS! Received response from agent")
        print(f"📦 Response type: {type(response)}")
        print(f"📄 Response content preview:")
        
        # Check if it's a proper PressReleaseResponse
        if hasattr(response, 'generated_releases'):
            print(f"   📊 Number of releases: {len(response.generated_releases)}")
            print(f"   🏢 Company: {response.company_name}")
            print(f"   📅 Timestamp: {response.timestamp}")
            print(f"   ✅ Status: {response.status}")
            
            # Show first release preview
            if response.generated_releases:
                first_release = response.generated_releases[0]
                print(f"   📰 First outlet: {first_release.outlet}")
                print(f"   📝 Word count: {first_release.word_count}")
                print(f"   🎨 Tone: {first_release.tone}")
                print(f"   📄 Content preview: {first_release.content[:200]}...")
        else:
            print(f"   ⚠️ Unexpected response format: {response}")
            
        print("\n🎉 AGENT COMMUNICATION TEST PASSED!")
        return True
        
    except Exception as e:
        print(f"\n❌ AGENT COMMUNICATION TEST FAILED!")
        print(f"🔍 Error type: {type(e)}")
        print(f"💥 Error message: {str(e)}")
        print(f"📋 Full traceback:")
        print(traceback.format_exc())
        return False

if __name__ == "__main__":
    print("Starting AgentVerse communication test...")
    success = asyncio.run(test_agent_communication())
    
    if success:
        print("\n✅ Agent is working correctly!")
        print("The issue might be with the backend configuration or environment.")
    else:
        print("\n❌ Agent communication failed!")
        print("This confirms there's an issue with the agent connection.") 