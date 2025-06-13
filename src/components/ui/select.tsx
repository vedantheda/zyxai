"use client"
import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}
interface SelectTriggerProps {
  className?: string
  children: React.ReactNode
}
interface SelectContentProps {
  className?: string
  children: React.ReactNode
}
interface SelectItemProps {
  value: string
  children: React.ReactNode
  className?: string
}
interface SelectValueProps {
  placeholder?: string
}
const SelectContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
}>({
  open: false,
  setOpen: () => {},
})
const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
  const [open, setOpen] = React.useState(false)
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  )
}
const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen } = React.useContext(SelectContext)
    return (
      <button
        ref={ref}
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
    )
  }
)
SelectTrigger.displayName = "SelectTrigger"
const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  const { value } = React.useContext(SelectContext)
  return <span>{value || placeholder}</span>
}
const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open } = React.useContext(SelectContext)
    if (!open) return null
    return (
      <div
        ref={ref}
        className={cn(
          "absolute top-full left-0 z-50 w-full mt-1 max-h-96 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md",
          className
        )}
        {...props}
      >
        <div className="p-1">
          {children}
        </div>
      </div>
    )
  }
)
SelectContent.displayName = "SelectContent"
const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, value, ...props }, ref) => {
    const { onValueChange, setOpen } = React.useContext(SelectContext)
    const handleClick = () => {
      onValueChange?.(value)
      setOpen(false)
    }
    return (
      <div
        ref={ref}
        onClick={handleClick}
        className={cn(
          "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SelectItem.displayName = "SelectItem"
export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
}
