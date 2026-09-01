import { useState, useEffect, useCallback } from 'react';
import { useSmartGlove } from './hooks/useSmartGlove';
import { SUPPORTED_LANGUAGES, LanguageOption, TTSStatus } from './types/smartGlove';
import { translationService } from './services/translationService';
import { ttsService } from './services/ttsService';

import { Navbar } from './components/Navbar';
import { LiveMessageCard } from './components/LiveMessageCard';
import { SpeechControls } from './components/SpeechControls';
import { TranslationPanel } from './components/TranslationPanel';
import { LanguageSelector } from './components/LanguageSelector';
import { UserInfoCard } from './components/UserInfoCard';
import { MessageHistory } from './components/MessageHistory';
import { SOSAlert } from './components/SOSAlert';
import { DemoControls } from './components/DemoControls';

export function App() {
  const {
    currentData,
    connectionStatus,
    history,
    isNewEvent,
    acknowledgeNewEvent,
    isDemoMode,
    setIsDemoMode,
    injectDemoMessage,
    updateHistoryItemTranslation,
  } = useSmartGlove();

  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(SUPPORTED_LANGUAGES[1]); // Default to Tamil
  const [ttsStatus, setTtsStatus] = useState<TTSStatus>('idle');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  // SOS Emergency State
  const [isSosActive, setIsSosActive] = useState<boolean>(false);
  const [isSosSilenced, setIsSosSilenced] = useState<boolean>(false);

  // Subscribe to TTS status changes
  useEffect(() => {
    const unsubscribe = ttsService.subscribe((status) => {
      setTtsStatus(status);
    });
    return () => unsubscribe();
  }, []);

  // Perform translation when current message or target language changes
  const performTranslation = useCallback(
    async (text: string, lang: LanguageOption) => {
      if (!text || !text.trim()) {
        setTranslatedText('');
        return;
      }

      // If English and ASCII text, direct display
      if (lang.code === 'en' && /^[\x00-\x7F]*$/.test(text)) {
        setTranslatedText(text);
        setTranslationError(null);
        return;
      }

      setIsTranslating(true);
      setTranslationError(null);

      try {
        const result = await translationService.translate(text, lang.name);
        setTranslatedText(result);
      } catch (err: unknown) {
        console.error('Translation error in UI:', err);
        setTranslationError(err instanceof Error ? err.message : 'Translation failed');
        setTranslatedText(text); // Fallback to raw text
      } finally {
        setIsTranslating(false);
      }
    },
    []
  );

  // When a new event arrives from polling or demo injection
  useEffect(() => {
    if (!currentData || !isNewEvent) return;

    const isSos = currentData.mode?.toUpperCase() === 'SOS' || currentData.is_sos === true;

    if (isSos) {
      setIsSosActive(true);
      setIsSosSilenced(false);
    } else {
      performTranslation(currentData.input, selectedLanguage);
    }

    acknowledgeNewEvent();
  }, [currentData, isNewEvent, selectedLanguage, performTranslation, acknowledgeNewEvent]);

  // When user switches language, translate current message
  const handleLanguageChange = (newLang: LanguageOption) => {
    setSelectedLanguage(newLang);
    if (currentData?.input) {
      performTranslation(currentData.input, newLang);
    }
  };

  // Primary Action: Translate & Speak
  const handleTranslateAndSpeak = async () => {
    if (!currentData?.input) return;

    try {
      let speechText = translatedText;

      // If translation not yet completed or empty, fetch it first
      if (!speechText || speechText === currentData.input) {
        if (selectedLanguage.code !== 'en') {
          setIsTranslating(true);
          speechText = await translationService.translate(currentData.input, selectedLanguage.name);
          setTranslatedText(speechText);
          setIsTranslating(false);
        } else {
          speechText = currentData.input;
        }
      }

      await ttsService.speak(speechText, selectedLanguage.locale);
    } catch (err) {
      console.error('Translate and speak failed:', err);
    }
  };

  // Play audio controls
  const handlePlayAudio = () => {
    const textToSpeak = translatedText || currentData?.input;
    if (textToSpeak) {
      ttsService.speak(textToSpeak, selectedLanguage.locale);
    }
  };

  const handlePauseAudio = () => {
    ttsService.pause();
  };

  const handleResumeAudio = () => {
    ttsService.resume();
  };

  const handleStopAudio = () => {
    ttsService.stop();
  };

  const handleAcknowledgeSOS = () => {
    setIsSosActive(false);
    setIsSosSilenced(true);
    ttsService.stop();
  };

  const handleSilenceSOS = () => {
    setIsSosSilenced((prev) => !prev);
    ttsService.stop();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Navigation */}
      <Navbar
        connectionStatus={connectionStatus}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={handleLanguageChange}
        isDemoMode={isDemoMode}
        onToggleDemoMode={() => setIsDemoMode((prev) => !prev)}
      />

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Offline Banner if FastAPI is down */}
        {connectionStatus === 'offline' && !isDemoMode && (
          <div
            role="alert"
            className="flex items-center justify-between p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm"
          >
            <div className="flex items-center gap-2 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span>
                Backend server is currently offline at <code className="text-white font-mono">http://localhost:8000</code>. Waiting for reconnection...
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsDemoMode(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-900/50 hover:bg-rose-800 text-xs font-bold text-white border border-rose-700 transition-colors"
            >
              Enable Demo Mode
            </button>
          </div>
        )}

        {/* Dashboard Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Central Column: Live Message & Audio & Translation (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Live Message Hero Card */}
            <LiveMessageCard
              data={currentData}
              selectedLanguage={selectedLanguage}
              onTranslateAndSpeak={handleTranslateAndSpeak}
              isLoading={isTranslating || ttsStatus === 'loading'}
              isSpeaking={ttsStatus === 'playing'}
            />

            {/* Speech Audio Control & Visualizer */}
            <SpeechControls
              status={ttsStatus}
              onPlay={handlePlayAudio}
              onPause={handlePauseAudio}
              onResume={handleResumeAudio}
              onStop={handleStopAudio}
              disabled={!currentData?.input}
            />

            {/* AI Translation Side-by-Side Panel */}
            <TranslationPanel
              originalText={currentData?.input || ''}
              translatedText={translatedText}
              selectedLanguage={selectedLanguage}
              isLoading={isTranslating}
              error={translationError}
              onPlayTranslation={handlePlayAudio}
              onRetryTranslation={() => {
                if (currentData?.input) performTranslation(currentData.input, selectedLanguage);
              }}
              isSpeaking={ttsStatus === 'playing'}
            />
          </div>

          {/* Right Column: User Info, Language Picker, History (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* User & RFID Hardware Card */}
            <UserInfoCard data={currentData} />

            {/* Language Selector Full Grid */}
            <div className="rounded-2xl bg-slate-900/70 border border-slate-800/80 p-5 backdrop-blur-md shadow-xl">
              <LanguageSelector
                selectedLanguage={selectedLanguage}
                onSelectLanguage={handleLanguageChange}
              />
            </div>

            {/* Communication History (Max 50 items) */}
            <MessageHistory
              history={history}
              selectedLanguage={selectedLanguage}
              onUpdateTranslation={updateHistoryItemTranslation}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>Smart Glove Assistive Communication System • Real-Time AI Translation & Speech Engine</p>
      </footer>

      {/* Full-Screen SOS Emergency Overlay */}
      {isSosActive && (
        <SOSAlert
          data={currentData}
          selectedLanguage={selectedLanguage}
          onAcknowledge={handleAcknowledgeSOS}
          onSilence={handleSilenceSOS}
          isSilenced={isSosSilenced}
        />
      )}

      {/* Developer Demo Controls Drawer */}
      <DemoControls
        isOpen={isDemoMode}
        onClose={() => setIsDemoMode(false)}
        onInjectMessage={injectDemoMessage}
      />
    </div>
  );
}

export default App;
