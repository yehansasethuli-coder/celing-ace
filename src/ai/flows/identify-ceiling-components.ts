'use server';
/**
 * @fileOverview This file defines a Genkit flow for identifying and counting components in a ceiling drawing.
 *
 * - identifyCeilingComponents - A function that takes a ceiling drawing and returns the count of each component.
 * - IdentifyCeilingComponentsInput - The input type for the identifyCeilingComponents function.
 * - IdentifyCeilingComponentsOutput - The return type for the identifyCeilingComponents function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyCeilingComponentsInputSchema = z.object({
  drawingDataUri: z
    .string()
    .describe(
      'A 2D drawing of the ceiling layout, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
});

export type IdentifyCeilingComponentsInput = z.infer<typeof IdentifyCeilingComponentsInputSchema>;

const IdentifyCeilingComponentsOutputSchema = z.object({
  mainTees: z.number().describe('The total count of long, horizontal main tee bars.'),
  crossTees: z.number().describe('The total count of short, vertical cross tee bars.'),
  ceilingBoards: z.number().describe('The total count of 2x2 ceiling board panels.'),
  wallAngles: z.number().describe('The total count of wall angles needed for the perimeter.'),
  reasoning: z.string().describe('A step-by-step explanation of how each component was counted from the drawing.')
});

export type IdentifyCeilingComponentsOutput = z.infer<typeof IdentifyCeilingComponentsOutputSchema>;

export async function identifyCeilingComponents(
  input: IdentifyCeilingComponentsInput
): Promise<IdentifyCeilingComponentsOutput> {
  return identifyCeilingComponentsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyCeilingComponentsPrompt',
  input: {schema: IdentifyCeilingComponentsInputSchema},
  output: {schema: IdentifyCeilingComponentsOutputSchema},
  prompt: `You are a ceiling construction expert. Your task is to analyze the provided 2D drawing of a ceiling layout and count the different components required.

Carefully examine the image provided: {{media url=drawingDataUri}}

Follow these rules for counting:
1.  **Main Tees**: These are the main horizontal support bars that span the full width of the drawing. Count the number of distinct horizontal lines.
2.  **Cross Tees**: These are the shorter vertical bars that fit between the main tees. Count the number of distinct vertical lines within the main grid.
3.  **Ceiling Boards**: These are the square panels that fill the grid. Count every single square, including full squares and partial (cut) squares around the border.
4.  **Wall Angles**: These form the perimeter frame. Based on the overall shape, determine how many standard length wall angles are needed. Assume they come in standard lengths you know.

Provide a step-by-step reasoning for your counts before giving the final numbers. Return the final count for each component in the specified JSON format.`,
});

const identifyCeilingComponentsFlow = ai.defineFlow(
  {
    name: 'identifyCeilingComponentsFlow',
    inputSchema: IdentifyCeilingComponentsInputSchema,
    outputSchema: IdentifyCeilingComponentsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('The model did not return an output.');
    }
    return output;
  }
);
