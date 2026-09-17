# 🏆 Score & Combo Micro-Engine
*Bộ máy tính điểm, tính chuỗi Combo Multiplier và đánh giá 1-3 sao — Tái sử dụng cho mọi game Casual / Arcade*

---

## 1. 📐 CẤU TRÚC DỮ LIỆU ĐIỂM SỐ (SCORE DATA STRUCTS)

```csharp
namespace ASOL.MicroEngines.Score
{
    [System.Serializable]
    public struct ScoreState
    {
        public int currentScore;
        public int comboStreak;
        public float comboMultiplier; // Ví dụ: x1.0, x1.5, x2.0, x3.0...
        public int starRating;        // 0, 1, 2, 3 sao
    }

    [System.Serializable]
    public struct StarThresholds
    {
        public int oneStarScore;   // Ví dụ: 1,000 điểm
        public int twoStarsScore;  // Ví dụ: 3,000 điểm
        public int threeStarsScore;// Ví dụ: 5,000 điểm
    }
}
```

---

## 2. ⚙️ THUẬT TOÁN TÍNH TOÁN (SCORE EVALUATOR LOGIC)

```csharp
namespace ASOL.MicroEngines.Score
{
    public class ScoreComboEngine
    {
        private ScoreState _state;
        private StarThresholds _thresholds;

        public ScoreState CurrentState => _state;

        public void Initialize(StarThresholds thresholds)
        {
            _thresholds = thresholds;
            _state = new ScoreState
            {
                currentScore = 0,
                comboStreak = 0,
                comboMultiplier = 1.0f,
                starRating = 0
            };
        }

        // Gọi mỗi khi người chơi ăn điểm
        public int AddBaseScore(int baseScore)
        {
            _state.comboStreak++;
            
            // Công thức Multiplier: Mỗi streak tăng 0.2x (tối đa x3.0)
            _state.comboMultiplier = System.Math.Min(1.0f + (_state.comboStreak - 1) * 0.2f, 3.0f);
            
            int finalEarned = (int)(baseScore * _state.comboMultiplier);
            _state.currentScore += finalEarned;

            UpdateStarRating();
            return finalEarned;
        }

        // Gọi khi người chơi bị đứt chuỗi combo (hết giờ / đi sai)
        public void ResetCombo()
        {
            _state.comboStreak = 0;
            _state.comboMultiplier = 1.0f;
        }

        private void UpdateStarRating()
        {
            if (_state.currentScore >= _thresholds.threeStarsScore) _state.starRating = 3;
            else if (_state.currentScore >= _thresholds.twoStarsScore) _state.starRating = 2;
            else if (_state.currentScore >= _thresholds.oneStarScore) _state.starRating = 1;
            else _state.starRating = 0;
        }
    }
}
```
