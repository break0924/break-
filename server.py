from __future__ import annotations

import json
import os
import mimetypes
import random
import socket
import string
import threading
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse


ROOT = Path(__file__).resolve().parent
STATIC_DIR = ROOT / "static"
DATA_DIR = ROOT / "data"
DATA_FILE = DATA_DIR / "rooms.json"
MAX_PLAYERS = 8
STARTING_CHIPS = 2000
SMALL_BLIND = 10
BIG_BLIND = 20

lock = threading.RLock()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def ensure_storage() -> None:
    DATA_DIR.mkdir(exist_ok=True)
    if not DATA_FILE.exists():
        DATA_FILE.write_text(json.dumps({"rooms": {}}, ensure_ascii=False, indent=2), encoding="utf-8")


def load_data() -> dict:
    ensure_storage()
    try:
        return json.loads(DATA_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {"rooms": {}}


def save_data(data: dict) -> None:
    DATA_DIR.mkdir(exist_ok=True)
    tmp = DATA_FILE.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(DATA_FILE)


def rid(prefix: str = "") -> str:
    alphabet = string.ascii_uppercase + string.digits
    return prefix + "".join(random.choice(alphabet) for _ in range(6))


def player_token() -> str:
    return rid("P")


def card_rank(card: str) -> int:
    order = "23456789TJQKA"
    return order.index(card[0]) + 2


def card_suit(card: str) -> str:
    return card[1]


def new_deck() -> list[str]:
    ranks = "23456789TJQKA"
    suits = "♠♥♦♣"
    deck = [r + s for s in suits for r in ranks]
    random.shuffle(deck)
    return deck


def hand_name(rank_value: int) -> str:
    return {
        8: "同花顺",
        7: "四条",
        6: "葫芦",
        5: "同花",
        4: "顺子",
        3: "三条",
        2: "两对",
        1: "一对",
        0: "高牌",
    }[rank_value]


def best_hand(cards: list[str]) -> tuple:
    from itertools import combinations

    best = None
    for combo in combinations(cards, 5):
        value = evaluate_five(list(combo))
        if best is None or value > best:
            best = value
    return best


def evaluate_five(cards: list[str]) -> tuple:
    ranks = sorted((card_rank(c) for c in cards), reverse=True)
    suits = [card_suit(c) for c in cards]
    counts = {}
    for rank in ranks:
        counts[rank] = counts.get(rank, 0) + 1
    ordered = sorted(counts.items(), key=lambda item: (-item[1], -item[0]))
    unique_ranks = sorted(set(ranks), reverse=True)
    is_flush = len(set(suits)) == 1

    straight_high = None
    straight_check = unique_ranks[:]
    if 14 in straight_check:
        straight_check.append(1)
    for i in range(len(straight_check) - 4):
        seq = straight_check[i : i + 5]
        if seq[0] - seq[4] == 4 and len(set(seq)) == 5:
            straight_high = max(seq)
            break

    sorted_groups = sorted(((count, rank) for rank, count in counts.items()), reverse=True)
    if is_flush and straight_high:
        return (8, straight_high)
    if sorted_groups[0][0] == 4:
        four_rank = sorted_groups[0][1]
        kicker = max(rank for rank in ranks if rank != four_rank)
        return (7, four_rank, kicker)
    if sorted_groups[0][0] == 3 and len(sorted_groups) > 1 and sorted_groups[1][0] >= 2:
        return (6, sorted_groups[0][1], sorted_groups[1][1])
    if is_flush:
        return (5, *ranks)
    if straight_high:
        return (4, straight_high)
    if sorted_groups[0][0] == 3:
        trips = sorted_groups[0][1]
        kickers = sorted([rank for rank in ranks if rank != trips], reverse=True)[:2]
        return (3, trips, *kickers)
    if sorted_groups[0][0] == 2 and len(sorted_groups) > 1 and sorted_groups[1][0] == 2:
        pair_high = max(sorted_groups[0][1], sorted_groups[1][1])
        pair_low = min(sorted_groups[0][1], sorted_groups[1][1])
        kicker = max(rank for rank in ranks if rank not in {pair_high, pair_low})
        return (2, pair_high, pair_low, kicker)
    if sorted_groups[0][0] == 2:
        pair = sorted_groups[0][1]
        kickers = sorted([rank for rank in ranks if rank != pair], reverse=True)[:3]
        return (1, pair, *kickers)
    return (0, *ranks)


def make_player(player_id: str, name: str) -> dict:
    return {
        "id": player_id,
        "name": name,
        "chips": STARTING_CHIPS,
        "folded": False,
        "bet": 0,
        "totalBet": 0,
        "hole": [],
        "lastAction": "",
        "joinedAt": now_iso(),
        "active": True,
    }


def room_public_view(room: dict, viewer_id: str | None = None) -> dict:
    result = json.loads(json.dumps(room))
    showdown = room.get("phase") == "showdown" or room.get("status") == "showdown"
    for player in result.get("players", []):
        if not showdown and player["id"] != viewer_id:
            player["hole"] = []
    return result


def current_active_indexes(room: dict) -> list[int]:
    return [i for i, player in enumerate(room["players"]) if player["active"] and not player["folded"] and player["chips"] >= 0]


def next_index(room: dict, start: int) -> int | None:
    players = room["players"]
    if not players:
        return None
    for offset in range(1, len(players) + 1):
        idx = (start + offset) % len(players)
        player = players[idx]
        if player["active"] and not player["folded"]:
            return idx
    return None


def reset_betting_state(room: dict) -> None:
    for player in room["players"]:
        player["bet"] = 0
    room["currentBet"] = 0
    room["actionsRemaining"] = len(current_active_indexes(room))


def deal_private_cards(room: dict) -> None:
    for _ in range(2):
        for player in room["players"]:
            if player["active"] and not player["folded"]:
                player["hole"].append(room["deck"].pop())


def start_hand(room: dict) -> None:
    active = [p for p in room["players"] if p["active"]]
    if len(active) < 2:
        raise ValueError("至少需要 2 名玩家")
    for player in room["players"]:
        player["folded"] = False
        player["bet"] = 0
        player["totalBet"] = 0
        player["hole"] = []
        player["lastAction"] = ""
    room["deck"] = new_deck()
    room["community"] = []
    room["pot"] = 0
    room["phase"] = "preflop"
    room["status"] = "playing"
    room["message"] = "新一局开始"
    room["handNo"] = room.get("handNo", 0) + 1
    room["dealerIndex"] = room.get("dealerIndex", -1)
    room["dealerIndex"] = next_index(room, room["dealerIndex"]) if room["dealerIndex"] >= 0 else 0
    if room["dealerIndex"] is None:
        room["dealerIndex"] = 0
    deal_private_cards(room)
    dealer = room["dealerIndex"]
    small = next_index(room, dealer)
    big = next_index(room, small) if small is not None else None
    if small is None or big is None:
        raise ValueError("玩家不足")
    post_blind(room, small, SMALL_BLIND)
    post_blind(room, big, BIG_BLIND)
    room["currentBet"] = BIG_BLIND
    room["turnIndex"] = next_index(room, big)
    room["actionsRemaining"] = len(current_active_indexes(room))
    room["message"] = f"第 {room['handNo']} 局开始，庄家：{room['players'][dealer]['name']}"


def post_blind(room: dict, idx: int, amount: int) -> None:
    player = room["players"][idx]
    taken = min(player["chips"], amount)
    player["chips"] -= taken
    player["bet"] += taken
    player["totalBet"] += taken
    room["pot"] += taken
    player["lastAction"] = f"盲注 {taken}"


def advance_to_next_actor(room: dict) -> None:
    current = room.get("turnIndex")
    if current is None:
        room["turnIndex"] = next_index(room, room.get("dealerIndex", -1))
        return
    room["turnIndex"] = next_index(room, current)


def finish_round_if_needed(room: dict) -> None:
    active = [p for p in room["players"] if p["active"] and not p["folded"]]
    if len(active) == 1:
        winner = active[0]
        winner["chips"] += room["pot"]
        room["message"] = f"{winner['name']} 赢下底池 {room['pot']}"
        room["pot"] = 0
        room["status"] = "showdown"
        room["phase"] = "showdown"
        room["turnIndex"] = None
        return

    if room.get("actionsRemaining", 0) > 0:
        return

    if room["phase"] == "preflop":
        room["community"].extend([room["deck"].pop(), room["deck"].pop(), room["deck"].pop()])
        room["phase"] = "flop"
    elif room["phase"] == "flop":
        room["community"].append(room["deck"].pop())
        room["phase"] = "turn"
    elif room["phase"] == "turn":
        room["community"].append(room["deck"].pop())
        room["phase"] = "river"
    elif room["phase"] == "river":
        room["phase"] = "showdown"
        room["status"] = "showdown"
        showdown(room)
        return

    reset_betting_state(room)
    dealer = room["dealerIndex"]
    room["turnIndex"] = next_index(room, dealer)
    room["message"] = f"进入 {room['phase']} 阶段"


def showdown(room: dict) -> None:
    contenders = [p for p in room["players"] if p["active"] and not p["folded"]]
    scored = []
    board = room["community"]
    for player in contenders:
        score = best_hand(player["hole"] + board)
        scored.append((score, player))
    scored.sort(key=lambda item: item[0], reverse=True)
    best_score = scored[0][0]
    winners = [player for score, player in scored if score == best_score]
    split = room["pot"] // len(winners)
    remainder = room["pot"] % len(winners)
    payout = []
    for index, player in enumerate(winners):
        gain = split + (1 if index < remainder else 0)
        player["chips"] += gain
        payout.append({"playerId": player["id"], "name": player["name"], "amount": gain})
    room["lastResult"] = {
        "winners": [player["name"] for player in winners],
        "handName": hand_name(best_score[0]),
        "score": list(best_score),
        "payout": payout,
        "potBefore": room["pot"],
    }
    room["message"] = f"{', '.join(room['lastResult']['winners'])} 赢得 {room['pot']}，牌型：{room['lastResult']['handName']}"
    room["pot"] = 0
    room["turnIndex"] = None


def apply_action(room: dict, player_id: str, action: str, amount: int | None = None) -> None:
    if room.get("status") != "playing":
        raise ValueError("请先开始牌局")
    turn_index = room.get("turnIndex")
    if turn_index is None:
        raise ValueError("当前没有可行动玩家")
    player = room["players"][turn_index]
    if player["id"] != player_id:
        raise ValueError("还没轮到你")

    if action == "fold":
        player["folded"] = True
        player["lastAction"] = "弃牌"
        room["actionsRemaining"] = max(0, room.get("actionsRemaining", 0) - 1)
    elif action == "check":
        if player["bet"] != room["currentBet"]:
            raise ValueError("不能过牌，请先跟注")
        player["lastAction"] = "过牌"
        room["actionsRemaining"] = max(0, room.get("actionsRemaining", 0) - 1)
    elif action == "call":
        need = room["currentBet"] - player["bet"]
        if need < 0:
            raise ValueError("下注状态错误")
        paid = min(need, player["chips"])
        player["chips"] -= paid
        player["bet"] += paid
        player["totalBet"] += paid
        room["pot"] += paid
        player["lastAction"] = f"跟注 {paid}"
        room["actionsRemaining"] = max(0, room.get("actionsRemaining", 0) - 1)
    elif action == "raise":
        step = amount or BIG_BLIND
        if step < BIG_BLIND:
            step = BIG_BLIND
        need = room["currentBet"] - player["bet"] + step
        paid = min(need, player["chips"])
        if paid < need:
            raise ValueError("筹码不足，无法加注")
        player["chips"] -= paid
        player["bet"] += paid
        player["totalBet"] += paid
        room["pot"] += paid
        room["currentBet"] = player["bet"]
        player["lastAction"] = f"加注到 {player['bet']}"
        room["actionsRemaining"] = max(0, len([p for p in room["players"] if p["active"] and not p["folded"]]) - 1)
    else:
        raise ValueError("未知操作")

    advance_to_next_actor(room)
    finish_round_if_needed(room)


def serialize_room(room: dict, viewer_id: str | None = None) -> dict:
    data = room_public_view(room, viewer_id)
    data["activePlayers"] = len([p for p in data["players"] if p["active"] and not p["folded"]])
    data["canStart"] = len([p for p in data["players"] if p["active"]]) >= 2 and data.get("status") != "playing"
    data["viewerId"] = viewer_id
    data["phaseLabel"] = {
        "preflop": "翻牌前",
        "flop": "翻牌圈",
        "turn": "转牌圈",
        "river": "河牌圈",
        "showdown": "摊牌",
    }.get(data.get("phase"), "等待")
    if data.get("turnIndex") is not None and 0 <= data["turnIndex"] < len(data["players"]):
        data["turnPlayer"] = data["players"][data["turnIndex"]]["name"]
    else:
        data["turnPlayer"] = None
    return data


def get_room(data: dict, room_id: str) -> dict:
    room = data["rooms"].get(room_id)
    if not room:
        raise KeyError("房间不存在")
    return room


def json_response(handler: BaseHTTPRequestHandler, payload: dict, status: int = 200) -> None:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def detect_lan_ip() -> str | None:
    try:
        probe = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        probe.connect(("8.8.8.8", 80))
        ip = probe.getsockname()[0]
        probe.close()
        if ip and not ip.startswith("127."):
            return ip
    except OSError:
        return None
    return None


class AppHandler(BaseHTTPRequestHandler):
    server_version = "TexasMVP/0.1"

    def log_message(self, format: str, *args) -> None:
        return

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/rooms/") and parsed.path.endswith("/state"):
            self.handle_room_state(parsed)
            return
        if parsed.path == "/api/health":
            json_response(self, {"ok": True})
            return
        if parsed.path == "/api/network":
            host = self.headers.get("Host", "").split(":")[0]
            json_response(self, {"host": host, "lanIp": detect_lan_ip()})
            return
        if parsed.path == "/":
            self.serve_static("index.html")
            return
        self.serve_asset(parsed.path)

    def do_POST(self):
        parsed = urlparse(self.path)
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length else b"{}"
        try:
            body = json.loads(raw.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            json_response(self, {"error": "无效 JSON"}, HTTPStatus.BAD_REQUEST)
            return

        if parsed.path == "/api/rooms":
            self.create_room(body)
            return
        if parsed.path.startswith("/api/rooms/"):
            parts = parsed.path.strip("/").split("/")
            if len(parts) >= 4 and parts[3] == "join":
                self.join_room(parts[2], body)
                return
            if len(parts) >= 4 and parts[3] == "start":
                self.start_room(parts[2], body)
                return
            if len(parts) >= 4 and parts[3] == "action":
                self.room_action(parts[2], body)
                return
        json_response(self, {"error": "未找到接口"}, HTTPStatus.NOT_FOUND)

    def serve_static(self, name: str):
        path = STATIC_DIR / name
        if not path.exists():
            json_response(self, {"error": "资源不存在"}, HTTPStatus.NOT_FOUND)
            return
        data = path.read_bytes()
        content_type = "text/html; charset=utf-8"
        if path.suffix == ".js":
            content_type = "application/javascript; charset=utf-8"
        elif path.suffix == ".css":
            content_type = "text/css; charset=utf-8"
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def serve_asset(self, path: str):
        safe_path = path.lstrip("/")
        if not safe_path or ".." in safe_path:
            json_response(self, {"error": "未找到页面"}, HTTPStatus.NOT_FOUND)
            return
        file_path = STATIC_DIR / safe_path
        if not file_path.exists() or not file_path.is_file():
            json_response(self, {"error": "未找到页面"}, HTTPStatus.NOT_FOUND)
            return
        data = file_path.read_bytes()
        content_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
        if content_type.startswith("text/") or content_type in {"application/javascript", "image/svg+xml"}:
            content_type = f"{content_type}; charset=utf-8"
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def create_room(self, body: dict):
        name = str(body.get("name") or "房主")[:20]
        player_id = body.get("playerId") or player_token()
        room_id = rid()
        room = {
            "roomId": room_id,
            "createdAt": now_iso(),
            "hostId": player_id,
            "players": [make_player(player_id, name)],
            "status": "lobby",
            "phase": "lobby",
            "deck": [],
            "community": [],
            "pot": 0,
            "currentBet": 0,
            "turnIndex": None,
            "dealerIndex": -1,
            "actionsRemaining": 0,
            "message": "房间已创建，等待好友加入",
            "handNo": 0,
            "lastResult": {},
        }
        with lock:
            data = load_data()
            data["rooms"][room_id] = room
            save_data(data)
        json_response(self, {"roomId": room_id, "playerId": player_id})

    def join_room(self, room_id: str, body: dict):
        room_id = room_id.upper()
        name = str(body.get("name") or "玩家")[:20]
        player_id = body.get("playerId") or player_token()
        with lock:
            data = load_data()
            room = get_room(data, room_id)
            players = room["players"]
            existing = next((player for player in players if player["id"] == player_id), None)
            if existing:
                existing["name"] = name
                existing["active"] = True
            else:
                if len([player for player in players if player["active"]]) >= MAX_PLAYERS:
                    json_response(self, {"error": "房间已满"}, HTTPStatus.BAD_REQUEST)
                    return
                players.append(make_player(player_id, name))
            save_data(data)
            room = get_room(data, room_id)
        json_response(self, {"ok": True, "room": serialize_room(room, player_id), "playerId": player_id})

    def start_room(self, room_id: str, body: dict):
        room_id = room_id.upper()
        player_id = body.get("playerId")
        with lock:
            data = load_data()
            room = get_room(data, room_id)
            if room["hostId"] != player_id:
                json_response(self, {"error": "只有房主可开局"}, HTTPStatus.FORBIDDEN)
                return
            try:
                start_hand(room)
            except ValueError as exc:
                json_response(self, {"error": str(exc)}, HTTPStatus.BAD_REQUEST)
                return
            save_data(data)
        json_response(self, {"ok": True, "room": serialize_room(room, player_id)})

    def room_action(self, room_id: str, body: dict):
        room_id = room_id.upper()
        player_id = body.get("playerId")
        action = body.get("action")
        amount = body.get("amount")
        with lock:
            data = load_data()
            room = get_room(data, room_id)
            try:
                apply_action(room, player_id, action, amount)
            except ValueError as exc:
                json_response(self, {"error": str(exc)}, HTTPStatus.BAD_REQUEST)
                return
            save_data(data)
        json_response(self, {"ok": True, "room": serialize_room(room, player_id)})

    def handle_room_state(self, parsed):
        room_id = parsed.path.strip("/").split("/")[2].upper()
        params = parse_qs(parsed.query)
        viewer_id = params.get("playerId", [None])[0]
        with lock:
            data = load_data()
            try:
                room = get_room(data, room_id)
            except KeyError:
                json_response(self, {"error": "房间不存在"}, HTTPStatus.NOT_FOUND)
                return
        json_response(self, {"room": serialize_room(room, viewer_id)})


def main() -> None:
    ensure_storage()
    port = int(os.environ.get("PORT", "8787"))
    host = os.environ.get("HOST", "0.0.0.0")
    server = ThreadingHTTPServer((host, port), AppHandler)
    print(f"Texas MVP running at http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
