using System.Collections.Concurrent;

namespace BackendAPI.Core.Services;

public class RateLimitService : IRateLimitService
{
    private const int MaxAttempts = 5;
    private static readonly TimeSpan HoldDuration = TimeSpan.FromMinutes(2);

    private class AttemptTracker
    {
        public int Count;
        public DateTime? HoldUntil;
        public readonly object Lock = new();
    }

    private readonly ConcurrentDictionary<string, AttemptTracker> _loginAttempts = new();
    private readonly ConcurrentDictionary<string, AttemptTracker> _registerAttemptsByIp = new();
    private readonly ConcurrentDictionary<string, AttemptTracker> _registerAttemptsByEmail = new();

    // ---------- LOGIN ----------

    public (bool allowed, int secondsRemaining) CheckLogin(string email)
    {
        return Check(_loginAttempts, email.ToLowerInvariant());
    }

    public void RecordFailedLogin(string email)
    {
        Record(_loginAttempts, email.ToLowerInvariant());
    }

    public void ResetLogin(string email)
    {
        _loginAttempts.TryRemove(email.ToLowerInvariant(), out _);
    }

    // ---------- REGISTER ----------

    public (bool allowed, int secondsRemaining) CheckRegister(string ipAddress, string email)
    {
        var ipResult = Check(_registerAttemptsByIp, ipAddress);
        if (!ipResult.allowed) return ipResult;

        var emailResult = Check(_registerAttemptsByEmail, email.ToLowerInvariant());
        if (!emailResult.allowed) return emailResult;

        return (true, 0);
    }

    public void RecordRegisterAttempt(string ipAddress, string email)
    {
        Record(_registerAttemptsByIp, ipAddress);
        Record(_registerAttemptsByEmail, email.ToLowerInvariant());
    }

    // ---------- SHARED LOGIC ----------

    private static (bool allowed, int secondsRemaining) Check(ConcurrentDictionary<string, AttemptTracker> store, string key)
    {
        if (!store.TryGetValue(key, out var tracker)) return (true, 0);

        lock (tracker.Lock)
        {
            if (tracker.HoldUntil.HasValue && tracker.HoldUntil.Value > DateTime.UtcNow)
            {
                var remaining = (int)Math.Ceiling((tracker.HoldUntil.Value - DateTime.UtcNow).TotalSeconds);
                return (false, remaining);
            }

            if (tracker.HoldUntil.HasValue && tracker.HoldUntil.Value <= DateTime.UtcNow)
            {
                // Hold period expired — reset.
                tracker.Count = 0;
                tracker.HoldUntil = null;
            }
        }

        return (true, 0);
    }

    private static void Record(ConcurrentDictionary<string, AttemptTracker> store, string key)
    {
        var tracker = store.GetOrAdd(key, _ => new AttemptTracker());

        lock (tracker.Lock)
        {
            if (tracker.HoldUntil.HasValue && tracker.HoldUntil.Value <= DateTime.UtcNow)
            {
                tracker.Count = 0;
                tracker.HoldUntil = null;
            }

            tracker.Count++;

            if (tracker.Count >= MaxAttempts)
            {
                tracker.HoldUntil = DateTime.UtcNow.Add(HoldDuration);
                tracker.Count = 0;
            }
        }
    }
}