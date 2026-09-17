# 🎮 Unity 6 Reusable Modules & Templates
*Các mô-đun C# mẫu tái sử dụng từ game trước sang game sau — ASOL Game OS v2*

---

## 1. 💾 MODULE: PURE C# SAVE SYSTEM (`Scripts/MicroEngines/SaveProfileManager.cs`)
*Lưu trữ JSON có mã hóa AES/XOR chống sửa điểm thô trên Android/iOS.*

```csharp
using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using UnityEngine;

namespace ASOL.Core.Save
{
    [Serializable]
    public class PlayerProfileData
    {
        public int currentLevel = 1;
        public int gold = 0;
        public int gems = 0;
        public bool hasRemovedAds = false;
        public float bgmVolume = 0.8f;
        public float sfxVolume = 1.0f;
    }

    public static class SaveProfileManager
    {
        private static readonly string SavePath = Path.Combine(Application.persistentDataPath, "asol_save.dat");
        private static readonly byte[] EncryptionKey = Encoding.UTF8.GetBytes("ASOL_CASUAL_2026_SECRET_KEY_123");

        public static PlayerProfileData Load()
        {
            if (!File.Exists(SavePath)) return new PlayerProfileData();

            try
            {
                byte[] cipherBytes = File.ReadAllBytes(SavePath);
                string json = DecryptString(cipherBytes, EncryptionKey);
                return JsonUtility.FromJson<PlayerProfileData>(json) ?? new PlayerProfileData();
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[SaveSystem] Lỗi đọc save, dùng default: {ex.Message}");
                return new PlayerProfileData();
            }
        }

        public static void Save(PlayerProfileData data)
        {
            string json = JsonUtility.ToJson(data);
            byte[] cipherBytes = EncryptString(json, EncryptionKey);
            File.WriteAllBytes(SavePath, cipherBytes);
        }

        private static byte[] EncryptString(string plainText, byte[] key)
        {
            byte[] plainBytes = Encoding.UTF8.GetBytes(plainText);
            byte[] result = new byte[plainBytes.Length];
            for (int i = 0; i < plainBytes.Length; i++)
            {
                result[i] = (byte)(plainBytes[i] ^ key[i % key.Length]);
            }
            return result;
        }

        private static string DecryptString(byte[] cipherBytes, byte[] key)
        {
            byte[] result = new byte[cipherBytes.Length];
            for (int i = 0; i < cipherBytes.Length; i++)
            {
                result[i] = (byte)(cipherBytes[i] ^ key[i % key.Length]);
            }
            return Encoding.UTF8.GetString(result);
        }
    }
}
```

---

## 2. 📡 MODULE: EVENT BUS PATTERN (`Scripts/MicroEngines/GameEvents.cs`)
*Tách rời 100% sự phụ thuộc giữa các hệ thống (Zero Coupling).*

```csharp
using System;

namespace ASOL.Core.Events
{
    public static class GameEvents
    {
        public static Action<int> OnScoreUpdated;
        public static Action<int, int> OnLevelCompleted; // level, stars
        public static Action OnGameOver;
        public static Action<int> OnGoldChanged;
        public static Action<string> OnRequestShowRewardAd;
        public static Action<string> OnRewardAdCompleted;
    }
}
```
