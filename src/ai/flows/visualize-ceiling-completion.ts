'use server';
/**
 * @fileOverview This file defines a Genkit flow for visualizing the completed ceiling appearance with a given texture.
 *
 * - visualizeCeilingCompletion - A function that takes a ceiling board photo and a drawing as input and returns a visualization of the completed ceiling.
 * - VisualizeCeilingCompletionInput - The input type for the visualizeCeilingCompletion function.
 * - VisualizeCeilingCompletionOutput - The return type for the visualizeCeilingCompletion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VisualizeCeilingCompletionInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a ceiling board, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  drawingDataUri: z
    .string()
    .describe(
      'A drawing of the ceiling layout, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Corrected description
    ),
});

export type VisualizeCeilingCompletionInput = z.infer<typeof VisualizeCeilingCompletionInputSchema>;

const VisualizeCeilingCompletionOutputSchema = z.object({
  completedCeilingVisualization: z
    .string()
    .describe(
      'A visualization of the completed ceiling with the provided texture, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
});

export type VisualizeCeilingCompletionOutput = z.infer<typeof VisualizeCeilingCompletionOutputSchema>;

export async function visualizeCeilingCompletion(
  input: VisualizeCeilingCompletionInput
): Promise<VisualizeCeilingCompletionOutput> {
  return visualizeCeilingCompletionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'visualizeCeilingCompletionPrompt',
  input: {schema: VisualizeCeilingCompletionInputSchema},
  output: {schema: VisualizeCeilingCompletionOutputSchema},
  prompt: `You are an interior design assistant. The user has provided a photo of a ceiling board and a drawing of the ceiling layout.  Your job is to generate an image of what the completed ceiling will look like with the texture of the ceiling board applied to the drawing.

Ceiling Board Texture: {{media url=photoDataUri}}
Ceiling Layout Drawing: {{media url=drawingDataUri}}`,
});

const visualizeCeilingCompletionFlow = ai.defineFlow(
  {
    name: 'visualizeCeilingCompletionFlow',
    inputSchema: VisualizeCeilingCompletionInputSchema,
    outputSchema: VisualizeCeilingCompletionOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: [
        {media: {url: input.drawingDataUri}},
        {text: `apply texture from this image ${input.photoDataUri}`},
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media || !media.url) {
      throw new Error('No visualization was generated.');
    }

    return {completedCeilingVisualization: media.url};
  }
);
