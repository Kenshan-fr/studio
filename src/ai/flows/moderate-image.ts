// src/ai/flows/moderate-image.ts
'use server';
/**
 * @fileOverview A flow for moderating images using the Gemini API to ensure content safety.
 *
 * - moderateImage - A function that moderates an image and returns whether it is safe.
 * - ModerateImageInput - The input type for the moderateImage function.
 * - ModerateImageOutput - The return type for the moderateImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ModerateImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ModerateImageInput = z.infer<typeof ModerateImageInputSchema>;

const ModerateImageOutputSchema = z.object({
  isExplicit: z.boolean().describe('Whether the image is explicit or not.'),
  hasWeapons: z.boolean().describe('Whether the image contains weapons or not.'),
  hasDrugs: z.boolean().describe('Whether the image contains drugs or not.'),
});
export type ModerateImageOutput = z.infer<typeof ModerateImageOutputSchema>;

export async function moderateImage(input: ModerateImageInput): Promise<ModerateImageOutput> {
  return moderateImageFilterFlow(input);
}

const moderateImageFilterPrompt = ai.definePrompt({
  name: 'moderateImageFilterPrompt',
  input: {schema: ModerateImageInputSchema},
  output: {schema: ModerateImageOutputSchema},
  prompt: `Analyze the image and determine if it contains sexually explicit content, weapons, or illegal drugs.

  Image: {{media url=photoDataUri}}

  Return true for the corresponding field if the image contains that content, otherwise return false.
  `,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const moderateImageFilterFlow = ai.defineFlow(
  {
    name: 'moderateImageFilterFlow',
    inputSchema: ModerateImageInputSchema,
    outputSchema: ModerateImageOutputSchema,
  },
  async input => {
    const {output} = await moderateImageFilterPrompt(input);
    return output!;
  }
);
