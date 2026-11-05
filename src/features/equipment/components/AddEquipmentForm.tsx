import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { useCreateEquipment } from '../hooks/useCreateEquipment'

const addEquipmentSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().min(10, 'Add a short description'),
  category: z.string().min(2, 'Category is required'),
  condition: z.enum(['New', 'Good', 'Fair', 'Damaged']),
  totalStock: z.number().int().min(1, 'Stock must be at least 1'),
  terms: z.string().min(5, 'Add borrowing terms'),
  usageInstructions: z.string().min(5, 'Add usage instructions'),
})

type AddEquipmentFormValues = z.infer<typeof addEquipmentSchema>

export function AddEquipmentForm() {
  const { mutate, isPending } = useCreateEquipment()
  const [condition, setCondition] = useState<AddEquipmentFormValues['condition']>('Good')
  const [imageFile, setImageFile] = useState<File | undefined>()
  const [imageInputKey, setImageInputKey] = useState(0)

  const form = useForm<AddEquipmentFormValues>({
    resolver: zodResolver(addEquipmentSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      condition: 'Good',
      totalStock: 1,
      terms: '',
      usageInstructions: '',
    },
  })

  const onSubmit = (values: AddEquipmentFormValues) => {
    if (!imageFile) {
      toast.error('Attach an equipment image.')
      return
    }
    mutate({ ...values, condition, imageFile }, {
      onSuccess: () => {
        toast.success('Equipment submitted for admin review')
        form.reset({ name: '', description: '', category: '', condition: 'Good', totalStock: 1, terms: '', usageInstructions: '' })
        setCondition('Good')
        setImageFile(undefined)
        setImageInputKey((key) => key + 1)
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to add equipment')
      },
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-zinc-300 focus-within:border-zinc-300 focus-within:ring-2 focus-within:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:focus-within:ring-zinc-800">
      <div className="space-y-2">
        <label htmlFor="equipmentImage" className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Upload equipment photo</label>
        <input key={imageInputKey} id="equipmentImage" type="file" accept="image/*" required onChange={(event) => setImageFile(event.target.files?.[0])} className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-pink-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white" />
      </div>
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Equipment name</label>
        <input id="name" {...form.register('name')} placeholder="Laptop, Camera, Drone..." className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus-visible:ring-offset-zinc-950" />
        {form.formState.errors.name && (
          <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="category" className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Category</label>
        <input id="category" {...form.register('category')} placeholder="Audio, Video, Computing..." className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus-visible:ring-offset-zinc-950" />
        {form.formState.errors.category && (
          <p className="text-sm text-red-600">{form.formState.errors.category.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="totalStock" className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Available units</label>
        <input id="totalStock" type="number" min={1} {...form.register('totalStock', { valueAsNumber: true })} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
        {form.formState.errors.totalStock && <p className="text-sm text-red-600">{form.formState.errors.totalStock.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="condition" className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Condition</label>
        <select
          id="condition"
          value={condition}
          onChange={(event) => {
            const nextValue = event.target.value as AddEquipmentFormValues['condition']
            setCondition(nextValue)
            form.setValue('condition', nextValue)
          }}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus-visible:ring-offset-zinc-950"
        >
          <option value="New">New</option>
          <option value="Good">Good</option>
          <option value="Fair">Fair</option>
          <option value="Damaged">Damaged</option>
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Description</label>
        <textarea id="description" {...form.register('description')} placeholder="Describe the equipment, specs, or availability notes" className="min-h-[100px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus-visible:ring-offset-zinc-950" />
        {form.formState.errors.description && (
          <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="terms" className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Borrowing terms</label>
        <textarea id="terms" {...form.register('terms')} placeholder="Rules for borrowing this equipment" className="min-h-[80px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
        {form.formState.errors.terms && <p className="text-sm text-red-600">{form.formState.errors.terms.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="usageInstructions" className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Usage instructions</label>
        <textarea id="usageInstructions" {...form.register('usageInstructions')} placeholder="Safe setup, handling, and return instructions" className="min-h-[80px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
        {form.formState.errors.usageInstructions && <p className="text-sm text-red-600">{form.formState.errors.usageInstructions.message}</p>}
      </div>

      <button type="submit" disabled={isPending} className="w-full rounded-lg border border-pink-700 bg-pink-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-zinc-900">
        {isPending ? 'Saving...' : 'Add equipment'}
      </button>
    </form>
  )
}
