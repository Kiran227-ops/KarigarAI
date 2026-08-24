'use client';

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

export default function PostForm({
  onPosted,
}: {
  onPosted?: () => void;
}) {
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [language, setLanguage] = useState('en-IN');
  const [listening, setListening] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // =====================================================
  // IMAGE PREVIEW
  // =====================================================

  useEffect(() => {
    if (!image) {
      setPreview(null);
      return;
    }

    const url = URL.createObjectURL(image);
    setPreview(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [image]);

  // =====================================================
  // VOICE INPUT
  // =====================================================

  function startVoiceInput() {
    setError(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        'Voice input is not supported in this browser. Please use Google Chrome.'
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript =
        event.results[0][0].transcript;

      // Put the spoken native-language text into textarea
      setContent((previous) => {
        if (previous.trim()) {
          return `${previous} ${transcript}`;
        }

        return transcript;
      });

      setListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event);

      setListening(false);

      setError(
        'Could not understand your voice. Please try again.'
      );
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  }

  // =====================================================
  // SUBMIT POST
  // =====================================================

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (content.trim().length < 10) {
      setError('Post must be at least 10 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();

      // Native-language text is sent to backend.
      // Backend will translate it to English.
      formData.append(
        'content',
        content.trim()
      );

      if (image) {
        formData.append('image', image);
      }

      const res = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || 'Failed to create post'
        );
      }

      // Clear form
      setContent('');
      setImage(null);
      setPreview(null);
      setError(null);

      onPosted?.();

    } catch (err: any) {
      setError(
        err.message || 'Something went wrong'
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3"
    >

      {/* Language selector */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Select your language
        </label>

        <select
          value={language}
          onChange={(e) =>
            setLanguage(e.target.value)
          }
          className="input w-full sm:w-48"
          disabled={listening || loading}
        >
          {LANGUAGES.map((lang) => (
            <option
              key={lang.code}
              value={lang.code}
            >
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* Post text + microphone */}
      <div className="relative">

        <textarea
          className="input min-h-[140px] w-full pr-16"
          placeholder="Share a problem you solved..."
          value={content}
          onChange={(e) =>
            setContent(e.target.value)
          }
        />

        {/* Microphone */}
        <button
          type="button"
          onClick={startVoiceInput}
          disabled={listening || loading}
          className={`absolute right-3 top-3 rounded-full px-3 py-2 ${
            listening
              ? 'bg-red-100 text-red-600'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          title="Speak your post"
        >
          {listening ? '🔴' : '🎤'}
        </button>

      </div>

      {/* Listening message */}
      {listening && (
        <p className="text-sm text-blue-600">
          🎤 Listening in{' '}
          {LANGUAGES.find(
            (lang) => lang.code === language
          )?.name}
          ... Speak now.
        </p>
      )}

      {/* Translation information */}
      <p className="text-xs text-slate-500">
        You can speak or type in your native
        language. Your post will be translated
        to English automatically.
      </p>

      {/* Image upload */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Add an image
        </label>

        <input
          type="file"
          accept="image/*"
          disabled={loading}
          onChange={(e) => {
            const file =
              e.target.files?.[0] || null;

            setImage(file);
            setError(null);
          }}
        />
      </div>

      {/* Image preview */}
      {preview && (
        <div className="mt-2">
          <img
            src={preview}
            alt="Selected image preview"
            className="max-w-sm max-h-80 rounded-lg border object-cover"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        className="btn-primary self-start"
        disabled={
          loading ||
          listening ||
          content.trim().length < 10
        }
        type="submit"
      >
        {loading
          ? 'Posting…'
          : 'Post experience'}
      </button>

    </form>
  );
}