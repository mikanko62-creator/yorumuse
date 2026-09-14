// In-memory anti-spam storage (sliding window)
interface RecentCommentEntry {
  text: string;
  timestamp: number;
}

const userLastCommentTime = new Map<string, number>();
const userRecentComments = new Map<string, RecentCommentEntry[]>();

// Clean up stale memory entries every 15 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [userId, time] of userLastCommentTime.entries()) {
      if (now - time > 30 * 60 * 1000) {
        userLastCommentTime.delete(userId);
      }
    }
    for (const [userId, entries] of userRecentComments.entries()) {
      const filtered = entries.filter((e) => now - e.timestamp < 10 * 60 * 1000);
      if (filtered.length === 0) {
        userRecentComments.delete(userId);
      } else {
        userRecentComments.set(userId, filtered);
      }
    }
  }, 15 * 60 * 1000);
}

export interface AntiSpamResult {
  isValid: boolean;
  error?: string;
}

export function validateCommentContent(
  rawContent: string,
  userId: string,
  honeypot?: string
): AntiSpamResult {
  // 1. Honeypot check for automated bots
  if (honeypot && honeypot.trim().length > 0) {
    return {
      isValid: false,
      error: "Spam bot terdeteksi.",
    };
  }

  const content = rawContent.trim();

  // 2. Length constraints
  if (content.length < 3) {
    return {
      isValid: false,
      error: "Komentar terlalu pendek (minimal 3 karakter).",
    };
  }

  if (content.length > 1000) {
    return {
      isValid: false,
      error: "Komentar terlalu panjang (maksimal 1.000 karakter).",
    };
  }

  // 3. Rate limiting (15 seconds cooldown per user)
  const now = Date.now();
  const lastTime = userLastCommentTime.get(userId);
  if (lastTime && now - lastTime < 15 * 1000) {
    const remainingSeconds = Math.ceil((15 * 1000 - (now - lastTime)) / 1000);
    return {
      isValid: false,
      error: `Harap tunggu ${remainingSeconds} detik sebelum mengirim komentar baru (Anti-Spam).`,
    };
  }

  // 4. Repetitive character flooding check (e.g. "aaaaaaa", "!!!!!!!!!!")
  const charFloodRegex = /(.)\1{7,}/i;
  if (charFloodRegex.test(content)) {
    return {
      isValid: false,
      error: "Komentar mengandung karakter berulang yang tidak wajar.",
    };
  }

  // 5. Suspicious links & keyword spam filter
  const urlCount = (content.match(/https?:\/\/|www\./gi) || []).length;
  if (urlCount > 1) {
    return {
      isValid: false,
      error: "Komentar tidak boleh memuat banyak tautan eksternal.",
    };
  }

  const spamKeywords = [
    "t.me/",
    "wa.me/",
    "slot gacor",
    "judi online",
    "deposit pulsa",
    "promo bonus",
    "bit.ly/",
    "tinyurl.com/",
    "pkv games",
  ];
  const lowerContent = content.toLowerCase();
  for (const keyword of spamKeywords) {
    if (lowerContent.includes(keyword)) {
      return {
        isValid: false,
        error: "Komentar terdeteksi memuat kata kunci promosi atau spam terlarang.",
      };
    }
  }

  // 6. Duplicate comment detector (within last 5 minutes)
  const userEntries = userRecentComments.get(userId) || [];
  const fiveMinutesAgo = now - 5 * 60 * 1000;
  const isDuplicate = userEntries.some(
    (entry) => entry.timestamp > fiveMinutesAgo && entry.text.toLowerCase() === content.toLowerCase()
  );

  if (isDuplicate) {
    return {
      isValid: false,
      error: "Anda baru saja mengirimkan komentar yang sama. Mohon hindari duplikasi.",
    };
  }

  // Register comment timestamp and content
  userLastCommentTime.set(userId, now);
  userRecentComments.set(userId, [
    ...userEntries.filter((e) => e.timestamp > fiveMinutesAgo),
    { text: content, timestamp: now },
  ]);

  return { isValid: true };
}
