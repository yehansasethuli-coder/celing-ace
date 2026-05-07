
"use server";

import { visualizeCeilingCompletion, VisualizeCeilingCompletionInput } from "@/ai/flows/visualize-ceiling-completion";
import { setDocumentNonBlocking } from "@/firebase";
import { doc, collection, Firestore, serverTimestamp } from "firebase/firestore";

export async function generateVisualizationAction(
  input: VisualizeCeilingCompletionInput
) {
  try {
    const result = await visualizeCeilingCompletion(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error in AI visualization:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during visualization.";
    return { success: false, error: errorMessage };
  }
}

export async function saveCeilingProjectAction(
  db: Firestore,
  userId: string,
  projectData: any
) {
  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }
  if (!projectData.projectName) {
    return { success: false, error: "Project name is required." };
  }
  try {
    const projectRef = doc(collection(db, `users/${userId}/ceilingProjects`));
    const dataToSave = { 
      ...projectData, 
      id: projectRef.id,
      createdAt: serverTimestamp() 
    };
    // We are not awaiting this, just firing and forgetting.
    // The UI will show a toast message optimistically.
    setDocumentNonBlocking(projectRef, dataToSave, {});
    return { success: true, data: { projectId: projectRef.id } };
  } catch (error) {
    console.error("Error saving project:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while saving.";
    return { success: false, error: errorMessage };
  }
}
