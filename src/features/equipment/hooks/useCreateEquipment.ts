import { useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function useCreateEquipment() {
  const queryClient = useQueryClient()
  const { user, profile } = useAuth()

  return useMutation({
    mutationFn: async (input: {
      name: string
      description: string
      category: string
      condition: 'New' | 'Good' | 'Fair' | 'Damaged'
      imageUrl?: string
      imageFile?: File
      totalStock?: number
      terms?: string
      usageInstructions?: string
    }) => {
      if (!user) {
        throw new Error('You must be signed in to add equipment.')
      }

      let uploadedImageUrl = input.imageUrl || null
      let uploadedImagePath: string | null = null
      if (input.imageFile) {
        if (!input.imageFile.type.startsWith('image/')) {
          throw new Error('Only image files can be attached.')
        }
        if (input.imageFile.size > 10 * 1024 * 1024) {
          throw new Error('The image must be 10 MB or smaller.')
        }
        const extension = input.imageFile.name.split('.').pop()?.toLowerCase() || 'jpg'
        const fileName = `${user.id}/${crypto.randomUUID()}.${extension}`
        uploadedImagePath = fileName
        const { error: uploadError } = await supabase.storage
          .from('equipment-images')
          .upload(fileName, input.imageFile, { upsert: false, contentType: input.imageFile.type })
        if (uploadError) throw uploadError
        const { data: publicUrl } = supabase.storage
          .from('equipment-images')
          .getPublicUrl(fileName)
        uploadedImageUrl = publicUrl.publicUrl
      }

      const stock = Math.max(1, Number(input.totalStock || 1))
      const { data, error } = await supabase
        .from('equipment')
        .insert({
          name: input.name,
          description: input.description,
          category: input.category,
          condition: input.condition,
          status: profile?.role === 'Admin' ? 'Available' : 'Pending',
          image_url: uploadedImageUrl,
          total_stock: stock,
          available_stock: profile?.role === 'Admin' ? stock : 0,
          terms: input.terms || null,
          usage_instructions: input.usageInstructions || null,
          review_status: profile?.role === 'Admin' ? 'Approved' : 'Pending',
          owner_type: profile?.role === 'Admin' ? 'School' : 'Student',
          owner_id: user.id,
        })
        .select()
        .single()

      if (error) {
        if (uploadedImagePath) {
          await supabase.storage.from('equipment-images').remove([uploadedImagePath])
        }
        throw error
      }

      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['equipment'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard', user?.id] })
    },
  })
}
