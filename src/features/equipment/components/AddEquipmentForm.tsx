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
})

type AddEquipmentFormValues = z.infer<typeof addEquipmentSchema>

export function AddEquipmentForm() {
  const { mutate, isPending } = useCreateEquipment()
  const [condition, setCondition] = useState<AddEquipmentFormValues['condition']>('Good')

  const form = useForm<AddEquipmentFormValues>({
    resolver: zodResolver(addEquipmentSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      condition: 'Good',
    },
  })

  const onSubmit = (values: AddEquipmentFormValues) => {
    mutate({ ...values, condition }, {
      onSuccess: () => {
        toast.success('Equipment added successfully')
        form.reset({ name: '', description: '', category: '', condition: 'Good' })
        setCondition('Good')
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to add equipment')
      },
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-slate-700">Equipment name</label>
        <input id="name" {...form.register('name')} placeholder="Laptop, Camera, Drone..." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-0 transition focus:border-blue-500" />
        {form.formState.errors.name && (
          <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="category" className="text-sm font-medium text-slate-700">Category</label>
        <input id="category" {...form.register('category')} placeholder="Audio, Video, Computing..." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500" />
        {form.formState.errors.category && (
          <p className="text-sm text-red-600">{form.formState.errors.category.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="condition" className="text-sm font-medium text-slate-700">Condition</label>
        <select
          id="condition"
          value={condition}
          onChange={(event) => {
            const nextValue = event.target.value as AddEquipmentFormValues['condition']
            setCondition(nextValue)
            form.setValue('condition', nextValue)
          }}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
        >
          <option value="New">New</option>
          <option value="Good">Good</option>
          <option value="Fair">Fair</option>
          <option value="Damaged">Damaged</option>
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium text-slate-700">Description</label>
        <textarea id="description" {...form.register('description')} placeholder="Describe the equipment, specs, or availability notes" className="min-h-[100px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500" />
        {form.formState.errors.description && (
          <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
        )}
      </div>

      <button type="submit" disabled={isPending} className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
        {isPending ? 'Saving...' : 'Add equipment'}
      </button>
    </form>
  )
}
