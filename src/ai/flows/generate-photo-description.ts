'use server';

/**
 * @fileOverview An AI agent for generating photo descriptions.
 *
 * - generatePhotoDescription - A function that generates a photo description.
 * - GeneratePhotoDescriptionInput - The input type for the generatePhotoDescription function.
 * - GeneratePhotoDescriptionOutput - The return type for the generatePhotoDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePhotoDescriptionInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GeneratePhotoDescriptionInput = z.infer<typeof GeneratePhotoDescriptionInputSchema>;

const GeneratePhotoDescriptionOutputSchema = z.object({
  description: z.string().describe('The generated description of the photo.'),
});
export type GeneratePhotoDescriptionOutput = z.infer<typeof GeneratePhotoDescriptionOutputSchema>;

export async function generatePhotoDescription(input: GeneratePhotoDescriptionInput): Promise<GeneratePhotoDescriptionOutput> {
  return generatePhotoDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePhotoDescriptionPrompt',
  input: {schema: GeneratePhotoDescriptionInputSchema},
  output: {schema: GeneratePhotoDescriptionOutputSchema},
  prompt: `You are an expert in generating engaging photo descriptions for social media.

  Generate a concise and attractive description for the photo, perfect for a social media post. Do not include any hashtags.

  Photo: {{media url=photoDataUri}}`,
});

const generatePhotoDescriptionFlow = ai.defineFlow(
  {
    name: 'generatePhotoDescriptionFlow',
    inputSchema: GeneratePhotoDescriptionInputSchema,
    outputSchema: GeneratePhotoDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
