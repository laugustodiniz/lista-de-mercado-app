import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_KEY ?? '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const EXTRACTION_PROMPT = `You are a shopping list extractor. Analyze the image and extract items that someone would buy at a supermarket.

Rules:
- If it's a handwritten or printed list: extract each item exactly as written.
- If it's a supermarket receipt: extract only product names. Ignore prices, quantities, brand suffixes with sizes (5KG, 1L, 500G), tax lines (ICMS, PIS, COFINS), store name, address, CNPJ, totals, discounts, and payment lines. Shorten names to 2-4 words (e.g. "ARROZ PARBORIZADO TIO JOAO 5KG" becomes "Arroz Parborizado").
- Output ONLY a valid JSON array of strings. No explanation, no markdown, no code block.
- Use Title Case in Portuguese.
- If no items found, return: []

Example: ["Arroz Parborizado", "Feijao Carioca", "Leite Integral"]`;

async function extractItemsFromBase64(base64: string): Promise<string[]> {
  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64,
      },
    },
    EXTRACTION_PROMPT,
  ]);

  const text = result.response.text();
  return JSON.parse(text) as string[];
}

export function usePhotoScanner() {
  const [isLoading, setIsLoading] = useState(false);

  async function scanFromGallery(): Promise<string[]> {
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

  async function scanFromCamera(): Promise<string[]> {
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

  async function runExtraction(base64: string): Promise<string[]> {
    setIsLoading(true);
    try {
      return await extractItemsFromBase64(base64);
    } catch {
      Alert.alert('Erro', 'Não foi possível analisar a imagem. Tente novamente.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }

  return { scanFromGallery, scanFromCamera, isLoading };
}
