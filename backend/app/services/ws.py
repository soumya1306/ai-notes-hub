from fastapi import WebSocket
from collections import defaultdict
import json


class ConnectionManager:
    """
    Tracks all active WebSocket connections, keyed bt node_id room.
    """

    def __init__(self) -> None:
        self._rooms: dict[str, dict[str, WebSocket]] = defaultdict(dict)

    async def connect(self, note_id: str, user_id: str, ws: WebSocket) -> None:
        await ws.accept()
        self._rooms[note_id][user_id] = ws

    def disconnect(self, note_id: str, user_id: str) -> None:
        """
        Removes a single user from a room. Cleans up the empty rooms.
        """
        self._rooms[note_id].pop(user_id, None)
        if note_id not in self._rooms and not self._rooms[note_id]:
            del self._rooms[note_id]

    async def broadcast(
        self, note_id: str, payload: dict[str, object], exclude_user: str | None = None
    ) -> None:
        """
        Send payload to every connection in a room except the sender.
        """
        dead: list[str] = []
        for uid, ws in list(self._rooms.get(note_id, {}).items()):
            if uid == exclude_user:
                continue
            try:
                await ws.send_text(json.dumps(payload))
            except Exception:
                dead.append(uid)

        for uid in dead:
            self.disconnect(note_id, uid)

    def presence(self, note_id: str) -> list[str]:
        """
        Returns a list of user_ids currently in a room
        """
        return list(self._rooms.get(note_id, {}).keys())

    async def close_room(self, note_id: str) -> None:
        """
        Focibly close every WebSocket in a room and remove the room.
        Called when a note is deleted, so all the connected clients must be kicked with WS_1001_GOING_AWAY.
        """

        connections = list(self._rooms.get(note_id, {}).items())
        for _uid, ws in connections:
            try:
                await ws.close(code=1001)
            except Exception:
                pass
        if note_id in self._rooms:
            del self._rooms[note_id]


manager = ConnectionManager()
