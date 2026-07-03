export interface Staff {
  id: number;
  user: { name: string; email: string; phone?: string; last_seen_at?: string | null };
  role: string;
  is_active: boolean;
  hired_at: string;
  specialization?: string | string[];
  active_jobs?: number;
  completed_jobs?: number;
}

/**
 * Returns a human-friendly relative last-seen string.
 * < 5 min  → "Online" (green dot)
 * < 60 min → "Xm ago"
 * < 24 h   → "Xh ago"
 * < 7 d    → "Xd ago"
 * else     → locale date string
 */
export function formatLastSeen(lastSeenAt: string | null | undefined): {
  label: string;
  isOnline: boolean;
} {
  if (!lastSeenAt) return { label: 'Never', isOnline: false };

  const diff = Math.floor((Date.now() - new Date(lastSeenAt).getTime()) / 1000); // seconds

  if (diff < 300)  return { label: 'Online',             isOnline: true  };
  if (diff < 3600) return { label: `${Math.floor(diff / 60)}m ago`,   isOnline: false };
  if (diff < 86400)return { label: `${Math.floor(diff / 3600)}h ago`,  isOnline: false };
  if (diff < 604800)return{ label: `${Math.floor(diff / 86400)}d ago`, isOnline: false };
  return { label: new Date(lastSeenAt).toLocaleDateString(), isOnline: false };
}
