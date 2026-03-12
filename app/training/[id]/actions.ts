'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/session'
import { recordTrainingCompletion } from '@/lib/training'

/**
 * Server Action to mark a training material as completed.
 * 
 * Validates the material ID, creates a completion record, revalidates the cache,
 * and redirects to the detail page with a success indicator.
 * 
 * @param formData - Form data containing the materialId
 * 
 * Validates:
 * - Requirements 3.2: Create completion record when user completes training
 * - Requirements 3.3: Set synced flag to false on completion
 * - Requirements 3.5: Refresh page after completion
 * - Requirements 4.3: Associate completion with authenticated user
 * - Requirements 4.4: Retrieve user from session
 * - Requirements 6.3: Display error message on completion failure
 * - Requirements 6.4: Validate material ID is valid integer
 * - Requirements 6.5: Handle foreign key constraint violations
 * - Requirements 7.3: Revalidate training list cache after completion
 */
export async function completeTraining(formData: FormData) {
  // Get authenticated user
  const { user } = await requireSession()
  
  // Extract and validate material ID
  const materialIdStr = formData.get('materialId') as string
  const materialId = parseInt(materialIdStr, 10)
  
  if (isNaN(materialId) || materialId <= 0) {
    redirect(`/training/${materialIdStr}?error=invalid_id`)
  }
  
  // Record completion
  const result = await recordTrainingCompletion(user.id, materialId)
  
  if (!result.success) {
    redirect(`/training/${materialId}?error=${encodeURIComponent(result.error)}`)
  }
  
  // Revalidate training list cache
  revalidatePath('/training')
  
  // Redirect with success message
  redirect(`/training/${materialId}?completed=true`)
}
