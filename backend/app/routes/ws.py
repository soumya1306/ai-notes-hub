from fastapi import APIRouter, WebSocket, Query, status, WebSocketDisconnect
from app.core.auth import verify_token
from app.database import get_db
from app.models.models import User
from app.services.ws import manager
import json

router = APIRouter(tags=["WebSockets"])


@router.websocket("/ws/notes/{note_id}")
async def note_ws(
    note_id: str,
    websocket: WebSocket,
    token: str = Query(...),
):
    try:
        user_id = verify_token(token, "access")
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    db = next(get_db())
    user = db.query(User).filter(User.id == user_id).first()
    user_email = user.email if user else user_id
    db.close()

    await manager.connect(note_id, user_id, websocket)

    await manager.broadcast(
        note_id,
        {
            "type": "presence",
            "event": "joined",
            "user_id": user_id,
            "user_email": user_email,
            "note_id": note_id,
        },
        exclude_user=user_id,
    )

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
                if msg.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
                elif msg.get("type") == "typing":
                    await manager.broadcast(
                        note_id,
                        {
                            "type": "typing",
                            "user_id": user_id,
                            "user_email": user_email,
                            "note_id": note_id,
                        },
                        exclude_user=user_id,
                    )
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(note_id, user_id)

        if manager.presence(note_id):
            await manager.broadcast(
                note_id,
                {
                    "type": "presence",
                    "event": "left",
                    "user_id": user_id,
                    "user_email": user_email,
                    "note_id": note_id,
                },
                exclude_user=user_id,
            )
