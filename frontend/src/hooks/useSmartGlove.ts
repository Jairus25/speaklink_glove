import { useState, useEffect, useRef, useCallback } from 'react';
import { SmartGloveData, BackendConnectionStatus, MessageHistoryItem } from '../types/smartGlove';
import { api } from '../services/api';

const MAX_HISTORY_ITEMS = 50;

export function useSmartGlove() {
  const [currentData, setCurrentData] = useState<SmartGloveData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<BackendConnectionStatus>('reconnecting');
  const [history, setHistory] = useState<MessageHistoryItem[]>([]);
  const [lastProcessedKey, setLastProcessedKey] = useState<string>('');
  const [isNewEvent, setIsNewEvent] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  
  // Track consecutive failures to adjust status
  const failureCountRef = useRef(0);
  const pollingRef = useRef<number | null>(null);
  const processedKeysRef = useRef<Set<string>>(new Set());

  const generateEventKey = (data: SmartGloveData): string => {
    const ts = data.timestamp || data.created_at || '';
    const id = data.id !== undefined ? `id${data.id}_` : '';
    return `${id}${data.event || 'EVT'}_${ts}_${data.input || ''}_${data.rfid_uid || ''}`;
  };

  const addHistoryItem = useCallback((data: SmartGloveData, isSos: boolean) => {
    const ts = data.timestamp || data.created_at || new Date().toISOString();
    const newItem: MessageHistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      event: data.event || 'INPUT_SENT',
      rfid_uid: data.rfid_uid || 'UNKNOWN',
      user_name: data.user_name || 'Anonymous User',
      mode: data.mode || 'PHRASE',
      input: data.input || '',
      timestamp: ts,
      is_sos: isSos,
    };

    setHistory((prev) => {
      // Avoid duplicate keys in history
      const exists = prev.some(
        (item) => item.input === newItem.input && item.timestamp === newItem.timestamp
      );
      if (exists) return prev;
      return [newItem, ...prev].slice(0, MAX_HISTORY_ITEMS);
    });
  }, []);

  const processIncomingData = useCallback((data: SmartGloveData | null) => {
    if (!data || !data.input) return;

    const eventKey = generateEventKey(data);
    const isSos = data.mode?.toUpperCase() === 'SOS' || data.is_sos === true;

    // Check if we already processed this unique event
    if (!processedKeysRef.current.has(eventKey)) {
      processedKeysRef.current.add(eventKey);
      setLastProcessedKey(eventKey);
      setCurrentData(data);
      setIsNewEvent(true);
      addHistoryItem(data, isSos);
    } else {
      // Just keep current data displayed if already loaded
      setCurrentData((prev) => prev || data);
      setIsNewEvent(false);
    }
  }, [addHistoryItem]);

  const pollBackend = useCallback(async () => {
    if (isDemoMode) return;

    try {
      const data = await api.fetchLatest();
      failureCountRef.current = 0;
      setConnectionStatus('connected');

      if (data) {
        processIncomingData(data);
      }
    } catch {
      failureCountRef.current += 1;
      if (failureCountRef.current > 3) {
        setConnectionStatus('offline');
      } else {
        setConnectionStatus('reconnecting');
      }
    }
  }, [isDemoMode, processIncomingData]);

  // Polling effect every 1 second
  useEffect(() => {
    if (isDemoMode) return;

    // Immediate initial poll
    pollBackend();

    const intervalId = window.setInterval(pollBackend, 1000);
    pollingRef.current = intervalId;

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [pollBackend, isDemoMode]);

  // Developer Demo Mode simulation functions
  const injectDemoMessage = useCallback((mode: 'PHRASE' | 'SOS', customText?: string) => {
    const timestamp = new Date().toISOString().replace('Z', '').split('.')[0];
    const isSos = mode === 'SOS';
    const demoData: SmartGloveData = {
      event: 'INPUT_SENT',
      rfid_uid: '3A 3D BF 62',
      user_name: 'Vasan',
      mode: mode,
      input: customText || (isSos ? 'Emergency assistance required immediately!' : "Hello, I'm Vasan. I need medicine."),
      timestamp: timestamp,
      is_sos: isSos,
    };

    const eventKey = `DEMO_${Date.now()}_${demoData.input}`;
    processedKeysRef.current.add(eventKey);
    setLastProcessedKey(eventKey);
    setCurrentData(demoData);
    setIsNewEvent(true);
    addHistoryItem(demoData, isSos);
  }, [addHistoryItem]);

  const acknowledgeNewEvent = useCallback(() => {
    setIsNewEvent(false);
  }, []);

  const updateHistoryItemTranslation = useCallback((historyId: string, translatedText: string, language: string) => {
    setHistory((prev) =>
      prev.map((item) =>
        item.id === historyId
          ? { ...item, translated_text: translatedText, language: language, speechGenerated: true }
          : item
      )
    );
  }, []);

  return {
    currentData,
    connectionStatus,
    history,
    lastProcessedKey,
    isNewEvent,
    acknowledgeNewEvent,
    isDemoMode,
    setIsDemoMode,
    injectDemoMessage,
    updateHistoryItemTranslation,
  };
}
