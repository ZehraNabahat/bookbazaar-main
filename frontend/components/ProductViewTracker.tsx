'use client';

import { useEffect } from 'react';
import axios from '@/lib/axios';
import { getChatSessionId } from '@/lib/chatSession';
import { useAuth } from '@/context/AuthContext';

export default function ProductViewTracker({ productId }: { productId: string }) {
  const { user } = useAuth();

  useEffect(() => {
    const sessionId = getChatSessionId(user?._id ?? null);
    axios.post('/api/ai/track-view', { productId, sessionId }).catch(() => {});
  }, [productId, user?._id]);

  return null;
}
