'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const LANGUAGES = [
  { code: 'en-IN', name: 'English' },
  { code: 'te-IN', name: 'Telugu' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'ta-IN', name: 'Tamil' },
  { code: 'kn-IN', name: 'Kannada' },
  { code: 'ml-IN', name: 'Malayalam' },
  { code: 'mr-IN', name: 'Marathi' },
  { code: 'bn-IN', name: 'Bengali' },
];

export default function SearchBar({
  initialValue = '',
}: {
  initialValue?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const [language, setLanguage] = useState('en-IN');
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

  function startVoiceInput() {
    setError('');

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        'Speech recognition is not supported. Please use Google Chrome.'
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setError('');
    };

    recognition.onresult = (event: any) => {
      let transcript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      if (transcript.trim()) {
        setValue(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);

      setListening(false);

      switch (event.error) {
        case 'not-allowed':
          setError(
            'Microphone permission denied. Click the microphone icon in Chrome and allow access.'
          );
          break;

        case 'no-speech':
          setError(
            'No speech detected. Click the microphone and speak clearly.'
          );
          break;

        case 'network':
          setError(
            'Speech recognition needs an internet connection. Please check your connection.'
          );
          break;

        case 'audio-capture':
          setError(
            'No microphone was detected. Check your microphone connection.'
          );
          break;

        default:
          setError(
            `Speech recognition failed: ${event.error || 'unknown error'}`
          );
      }
    };

    recognition.onend = () => {
      setListening(false);
    };

    try {
      recognition.start();
    } catch (err) {
      console.error('Could not start speech recognition:', err);
      setListening(false);
      setError('Could not start the microphone. Please try again.');
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!value.trim()) return;

    router.push(`/search?q=${encodeURIComponent(value.trim())}`);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">

      <div className="flex flex-col sm:flex-row gap-3">

        {/* Language */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="input sm:w-40"
          disabled={listening}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>

        {/* Search input + microphone */}
        <div className="relative flex-1">

          <input
            className="input w-full pr-14"
            placeholder="Describe your problem..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />

          <button
            type="button"
            onClick={startVoiceInput}
            disabled={listening}
            className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-3 py-2 ${
              listening
                ? 'bg-red-100 text-red-600'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title="Speak your problem"
          >
            {listening ? '🔴' : '🎤'}
          </button>

        </div>

        {/* Search */}
        <button
          className="btn-primary whitespace-nowrap"
          type="submit"
        >
          Find a technician
        </button>

      </div>

      {/* Listening message */}
      {listening && (
        <div className="text-sm text-blue-600">
          🎤 Listening in{' '}
          {LANGUAGES.find((l) => l.code === language)?.name}...
          <br />
          Speak your problem now.
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      <p className="text-xs text-slate-500">
        Select your language and use the microphone to describe your problem.
      </p>

    </form>
  );
}