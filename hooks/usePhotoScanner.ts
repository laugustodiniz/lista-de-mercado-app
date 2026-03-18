import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const EXTRACTION_PROMPT = `You are a shopping list extractor. Analyze the image and extract items that someone would buy at a supermarket.

Rules:
- If it's a handwritten or printed list: extract each item exactly as written.
- If it's a supermarket receipt: extract only product names. Ignore prices, quantities, brand suffixes with sizes (5KG, 1L, 500G), tax lines (ICMS, PIS, COFINS), store name, address, CNPJ, totals, discounts, and payment lines. Shorten names to 2-4 words (e.g. "ARROZ PARBORIZADO TIO JOAO 5KG" becomes "Arroz Parborizado").
- Output ONLY a valid JSON array of strings. No explanation, no markdown, no code block.
- Use Title Case in Portuguese.
- If no items found, return: []

Example: ["Arroz Parborizado", "Feijao Carioca", "Leite Integral"]`;

async function extractItemsFromBase64(base64: string): Promise<string[]> {
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
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64,
              },
            },
            { type: 'text', text: EXTRACTION_PROMPT },
          ],
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

export function usePhotoScanner() {
  const [isLoading, setIsLoading] = useState(false);

  async function scanFromGallery(): Promise<string[] | null> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão negada', 'Permita o acesso à galeria nas configurações do app.');
      return [];
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      base64: true,
      quality: 0.7,
    });

    if (result.canceled || !result.assets[0]?.base64) return [];

    return runExtraction(result.assets[0].base64);
  }

  async function scanFromCamera(): Promise<string[] | null> {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão negada', 'Permita o acesso à câmera nas configurações do app.');
      return [];
    }

    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.7,
    });

    if (result.canceled || !result.assets[0]?.base64) return [];

    return runExtraction(result.assets[0].base64);
  }

  // Retorna null se houve erro (alerta já exibido), [] se vazio, string[] se achou itens
  async function runExtraction(base64: string): Promise<string[] | null> {
    setIsLoading(true);
    try {
      return await extractItemsFromBase64(base64);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Erro', msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return { scanFromGallery, scanFromCamera, isLoading };
}
