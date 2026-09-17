# 🎯 Level Progression Micro-Engine
*Bộ máy quản lý màn chơi, mục tiêu (Goals), số lượt đi (Moves) và kiểm tra Thắng/Thua — Tái sử dụng cho mọi game Casual có Level*

---

## 1. 📐 CẤU TRÚC DỮ LIỆU MÀN CHƠI (LEVEL DATA STRUCTS)

```gdscript
class_name LevelDataStructs
extends RefCounted

# Dữ liệu cấu hình 1 màn chơi (Load từ JSON)
class LevelConfig:
	var level_id: int = 1
	var max_moves: int = 20
	var target_score: int = 1000
	var target_items: Dictionary = {} # {"red_block": 10, "ice_block": 5}

# Trạng thái trong trận đấu
class LevelSessionState:
	var moves_remaining: int = 20
	var current_score: int = 0
	var items_collected: Dictionary = {}
	var status: String = "PLAYING" # "PLAYING", "WON", "LOST"
```

---

## 2. ⚙️ THUẬT TOÁN ĐÁNH GIÁ THẮNG / THUA (WIN/LOSE EVALUATOR)

```gdscript
class_name LevelProgressionEngine
extends RefCounted

var config: LevelDataStructs.LevelConfig
var session: LevelDataStructs.LevelSessionState

func start_level(level_cfg: LevelDataStructs.LevelConfig) -> void:
	config = level_cfg
	session = LevelDataStructs.LevelSessionState.new()
	session.moves_remaining = config.max_moves
	session.status = "PLAYING"
	for key in config.target_items.keys():
		session.items_collected[key] = 0

# Gọi mỗi khi người chơi thực hiện 1 lượt đi
func consume_move() -> void:
	if session.status != "PLAYING":
		return
	session.moves_remaining -= 1
	evaluate_state()

# Gọi khi người chơi thu thập được vật phẩm mục tiêu
func collect_item(item_type: String, count: int = 1) -> void:
	if session.items_collected.has(item_type):
		session.items_collected[item_type] += count
		evaluate_state()

# Kiểm tra điều kiện thắng/thua
func evaluate_state() -> String:
	var all_targets_met: bool = true
	for key in config.target_items.keys():
		if session.items_collected[key] < config.target_items[key]:
			all_targets_met = false
			break
	
	if all_targets_met:
		session.status = "WON"
	elif session.moves_remaining <= 0:
		session.status = "LOST"
	else:
		session.status = "PLAYING"
		
	return session.status
```
