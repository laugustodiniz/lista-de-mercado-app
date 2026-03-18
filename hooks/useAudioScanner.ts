import { useState, useRef, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const WHISPER_API_URL = 'https://api.openai.com/v1/audio/transcriptions';
const MAX_DURATION_SEC = 120;

const AUDIO_EXTRACTION_PROMPT = `You are a shopping list extractor. The user dictated shopping items.
Extract each item mentioned from the transcribed text below.

Rules:
- Extract each distinct item
- Ignore filler words, greetings, quantities, prices
- Use Title Case in Portuguese
- Output ONLY a valid JSON array of strings. No explanation, no markdown, no code block.
- If no items found, return: []

Example: ["Arroz", "Feijão Carioca", "Leite Integral"]

Transcribed text:`;

async function transcribeAudio(uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();

  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'audio/m4a',
    name: 'recording.m4a',
  } as unknown as Blob);
  formData.append('model', 'whisper-1');
  formData.append('language', 'pt');

  const res = await fetch(WHISPER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_KEY ?? ''}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Whisper ${res.status}: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  return data.text as string;
}

async function extractItemsFromText(transcription: string): Promise<string[]> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': process.env.EXPO_PUBLIC_ANTHROPIC_KEY ?? '',
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `${AUDIO_EXTRACTION_PROMPT}\n"${transcription}"`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`${res.status}: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  const text: string = data.content?.[0]?.text?.trim() ?? '';
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(cleaned) as string[];
}

export function useAudioScanner() {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, [clearTimer]);

  async function startRecording(): Promise<void> {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão negada', 'Permita o acesso ao microfone nas configurações do app.');
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    recordingRef.current = recording;
    setIsRecording(true);
    setRecordingDuration(0);

    timerRef.current = setInterval(() => {
      setRecordingDuration(prev => {
        if (prev + 1 >= MAX_DURATION_SEC) {
          stopRecording();
          return MAX_DURATION_SEC;
        }
        return prev + 1;
      });
    }, 1000);
  }

  async function stopRecording(): Promise<string[] | null> {
    clearTimer();

    const recording = recordingRef.current;
    if (!recording) return null;

    setIsRecording(false);
    recordingRef.current = null;

    try {
      await recording.stopAndUnloadAsync();
    } catch {
      // já parado
    }

    const uri = recording.getURI();
    if (!uri) {
      Alert.alert('Erro', 'Não foi possível obter o arquivo de áudio.');
      return null;
    }

    setIsLoading(true);
    try {
      // Passo 1: Whisper transcreve o áudio
      const transcription = await transcribeAudio(uri);

      if (!transcription.trim()) {
        return [];
      }

      // Passo 2: Claude extrai os itens do texto
      return await extractItemsFromText(transcription);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Erro', msg);
      return null;
    } finally {
      setIsLoading(false);
      setRecordingDuration(0);
    }
  }

  return { startRecording, stopRecording, isRecording, isLoading, recordingDuration };
}
