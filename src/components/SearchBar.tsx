'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

const INTRO_COPY: Record<
  string,
  { heading: string; subtitle: string; placeholder: string; helper: string }
> = {
  'en-IN': {
    heading: 'What problem can we solve for you today?',
    subtitle: "Describe your problem and we'll help you find the right technician.",
    placeholder: 'Describe your problem...',
    helper: 'Select your language and use the microphone to describe your problem.',
  },
  'te-IN': {
    heading: 'ఈరోజు మీకు ఏ సమస్యను పరిష్కరించడంలో మేము సహాయం చేయగలము?',
    subtitle: 'మీ సమస్యను వివరించండి, మీకు సరైన టెక్నీషియన్‌ను కనుగొనడంలో మేము సహాయం చేస్తాము.',
    placeholder: 'మీ సమస్యను వివరించండి...',
    helper: 'మీ భాషను ఎంచుకుని, మీ సమస్యను వివరించడానికి మైక్రోఫోన్‌ను ఉపయోగించండి.',
  },
  'hi-IN': {
    heading: 'आज हम आपके लिए कौन सी समस्या हल कर सकते हैं?',
    subtitle: 'अपनी समस्या बताएं और हम आपके लिए सही तकनीशियन खोजने में मदद करेंगे।',
    placeholder: 'अपनी समस्या बताएं...',
    helper: 'अपनी भाषा चुनें और अपनी समस्या बताने के लिए माइक्रोफ़ोन का उपयोग करें।',
  },
  'ta-IN': {
    heading: 'இன்று உங்களுக்காக எந்தப் பிரச்சினையை நாங்கள் தீர்க்கலாம்?',
    subtitle: 'உங்கள் பிரச்சினையை விவரிக்கவும், உங்களுக்கான சரியான தொழில்நுட்ப நிபுணரைக் கண்டறிய நாங்கள் உதவுகிறோம்.',
    placeholder: 'உங்கள் பிரச்சினையை விவரிக்கவும்...',
    helper: 'உங்கள் மொழியைத் தேர்ந்தெடுத்து, உங்கள் பிரச்சினையை விவரிக்க மைக்ரோஃபோனைப் பயன்படுத்தவும்.',
  },
  'kn-IN': {
    heading: 'ಇಂದು ನಿಮಗಾಗಿ ನಾವು ಯಾವ ಸಮಸ್ಯೆಯನ್ನು ಪರಿಹರಿಸಬಹುದು?',
    subtitle: 'ನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ವಿವರಿಸಿ, ನಿಮಗೆ ಸರಿಯಾದ ತಂತ್ರಜ್ಞರನ್ನು ಹುಡುಕಲು ನಾವು ಸಹಾಯ ಮಾಡುತ್ತೇವೆ.',
    placeholder: 'ನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ವಿವರಿಸಿ...',
    helper: 'ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ ಮತ್ತು ನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ವಿವರಿಸಲು ಮೈಕ್ರೊಫೋನ್ ಬಳಸಿ.',
  },
  'ml-IN': {
    heading: 'ഇന്ന് നിങ്ങൾക്കായി ഞങ്ങൾക്ക് ഏത് പ്രശ്നമാണ് പരിഹരിക്കാൻ കഴിയുക?',
    subtitle: 'നിങ്ങളുടെ പ്രശ്നം വിവരിക്കൂ, നിങ്ങൾക്ക് അനുയോജ്യമായ ടെക്നീഷ്യനെ കണ്ടെത്താൻ ഞങ്ങൾ സഹായിക്കും.',
    placeholder: 'നിങ്ങളുടെ പ്രശ്നം വിവരിക്കൂ...',
    helper: 'നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക, പ്രശ്നം വിവരിക്കാൻ മൈക്രോഫോൺ ഉപയോഗിക്കുക.',
  },
  'mr-IN': {
    heading: 'आज आम्ही तुमच्यासाठी कोणती समस्या सोडवू शकतो?',
    subtitle: 'तुमची समस्या सांगा आणि आम्ही तुमच्यासाठी योग्य तंत्रज्ञ शोधण्यात मदत करू.',
    placeholder: 'तुमची समस्या सांगा...',
    helper: 'तुमची भाषा निवडा आणि तुमची समस्या सांगण्यासाठी मायक्रोफोन वापरा.',
  },
  'bn-IN': {
    heading: 'আজ আমরা আপনার জন্য কোন সমস্যার সমাধান করতে পারি?',
    subtitle: 'আপনার সমস্যাটি বর্ণনা করুন এবং আমরা আপনার জন্য সঠিক প্রযুক্তিবিদ খুঁজে পেতে সাহায্য করব।',
    placeholder: 'আপনার সমস্যাটি বর্ণনা করুন...',
    helper: 'আপনার ভাষা নির্বাচন করুন এবং আপনার সমস্যাটি জানাতে মাইক্রোফোন ব্যবহার করুন।',
  },
};

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
  const introCopy = INTRO_COPY[language] || INTRO_COPY['en-IN'];

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem('preferred-language');

    if (savedLanguage && INTRO_COPY[savedLanguage]) {
      setLanguage(savedLanguage);
    }
  }, []);

  function changeLanguage(nextLanguage: string) {
    setLanguage(nextLanguage);
    window.localStorage.setItem('preferred-language', nextLanguage);
  }

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
    <div className="text-center">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-slate-900">
          {introCopy.heading}
        </h1>
        <p className="mt-2 text-sm text-slate-500">{introCopy.subtitle}</p>
      </div>

      <form onSubmit={submit} className="mx-auto flex max-w-4xl flex-col gap-3 text-left">

      <div className="flex flex-col sm:flex-row gap-3">

        {/* Language */}
        <select
          value={language}
          onChange={(e) => changeLanguage(e.target.value)}
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
            placeholder={introCopy.placeholder}
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

      <p className="text-xs text-slate-500">{introCopy.helper}</p>

      </form>
    </div>
  );
}