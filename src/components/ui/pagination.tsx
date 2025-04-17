"use client"

import * as React from "react"
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react"

import { cn } from "@/lib/utils"

type PaginationProps = {
  page: number
  totalPages: number
  setPage: (page: number) => void
}

const Pagination = ({ page, totalPages, setPage }: PaginationProps) => {
  const hasPreviousPage = page > 1
  const hasNextPage = page < totalPages

  const onNext = () => {
    if (hasNextPage) {
      setPage(page + 1)
    }
  }

  const onPrevious = () => {
    if (hasPreviousPage) {
      setPage(page - 1)
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <PaginationContent>
        <PaginationPrevious
          href="#"
          onClick={onPrevious}
          disabled={!hasPreviousPage}
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </PaginationPrevious>
        <PaginationNext
          href="#"
          onClick={onNext}
          disabled={!hasNextPage}
        >
          <span>Next</span>
          <ChevronRight className="h-4 w-4" />
        </PaginationNext>
      </PaginationContent>
    </div>
  )
}

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn(
      "flex w-full items-center justify-center gap-2",
      className
    )}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("w-10", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

const PaginationLink = React.forwardRef<
  HTMLAnchorElement,
  React.HTMLAttributes<HTMLAnchorElement>
>(({ className, ...props }, ref) => (
  <a
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-secondary hover:text-accent-foreground h-10 w-10 bg-background",
      className
    )}
    {...props}
  />
))
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = React.forwardRef<
  HTMLAnchorElement,
  React.HTMLAttributes<HTMLAnchorElement>
>(({ className, ...props }, ref) => (
  <a
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-secondary hover:text-accent-foreground h-10 bg-background px-4 py-2 gap-2",
      className
    )}
    {...props}
  />
))
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = React.forwardRef<
  HTMLAnchorElement,
  React.HTMLAttributes<HTMLAnchorElement>
>(({ className, ...props }, ref) => (
  <a
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-secondary hover:text-accent-foreground h-10 bg-background px-4 py-2 gap-2",
      className
    )}
    {...props}
  />
))
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn("flex h-10 w-10 items-center justify-center text-sm", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    
  </span>
))
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}
