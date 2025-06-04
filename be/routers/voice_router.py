from fastapi import APIRouter, Body
from typing import Dict, Any
from services.voice_command_service import VoiceCommandService

router = APIRouter()
voice_service = VoiceCommandService()

@router.post("/process-text")
async def process_text(text: Dict[str, str] = Body(...)) -> Dict[str, Any]:
    """
    Process voice command text and execute corresponding device actions
    """
    result = await voice_service.process_command(text["text"])
    return result 