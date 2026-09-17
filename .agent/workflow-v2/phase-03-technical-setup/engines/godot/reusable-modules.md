# 🤖 Godot 4 Reusable Modules & Templates
*Các mô-đun GDScript mẫu tái sử dụng từ game trước sang game sau — ASOL Game OS v2*

---

## 1. 📡 MODULE: CENTRAL EVENT BUS (`autoload/event_bus.gd`)
*Giúp toàn bộ hệ thống trong game giao tiếp mà không phụ thuộc lẫn nhau (Zero Coupling).*

```gdscript
extends Node

# Signal gameplay
signal score_updated(new_score: int)
signal level_completed(stars: int, gold_earned: int)
signal game_over(reason: String)

# Signal kinh tế & UI
signal gold_changed(total_gold: int)
signal booster_used(booster_type: String)
signal request_show_reward_ad(placement_id: String)
signal reward_ad_completed(placement_id: String)
```

---

## 2. 💾 MODULE: RESOURCE SAVE SYSTEM (`core/save_system.gd`)
*Lưu dữ liệu an toàn bằng Godot Resource có mã hóa chống cheat.*

```gdscript
class_name SaveSystem
extends RefCounted

const SAVE_PATH := "user://asol_save_v1.dat"
const ENCRYPTION_KEY := "ASOL_STUDIO_SECRET_2026"

static func save_data(data: Dictionary) -> bool:
	var file := FileAccess.open_encrypted_with_pass(SAVE_PATH, FileAccess.WRITE, ENCRYPTION_KEY)
	if not file:
		return false
	file.store_string(JSON.stringify(data))
	file.close()
	return true

static func load_data() -> Dictionary:
	if not FileAccess.file_exists(SAVE_PATH):
		return get_default_data()
	var file := FileAccess.open_encrypted_with_pass(SAVE_PATH, FileAccess.READ, ENCRYPTION_KEY)
	if not file:
		return get_default_data()
	var json_str := file.get_as_text()
	file.close()
	var parsed = JSON.parse_string(json_str)
	return parsed if typeof(parsed) == TYPE_DICTIONARY else get_default_data()

static func get_default_data() -> Dictionary:
	return {
		"current_level": 1,
		"gold": 0,
		"has_removed_ads": false,
		"settings": {"bgm": 0.8, "sfx": 1.0}
	}
```
