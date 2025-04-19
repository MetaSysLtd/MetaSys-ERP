import { useState, useEffect } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface CustomPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function CustomPagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: CustomPaginationProps) {
  const [paginationItems, setPaginationItems] = useState<(number | string)[]>([]);

  useEffect(() => {
    // Generate pagination items based on current page and total pages
    const generatePaginationItems = () => {
      const items: (number | string)[] = [];
      
      if (totalPages <= 7) {
        // Show all pages if there are 7 or fewer
        for (let i = 1; i <= totalPages; i++) {
          items.push(i);
        }
      } else {
        // Always include first page
        items.push(1);
        
        // Decide which pages to show around the current page
        if (currentPage <= 3) {
          // Near the start
          items.push(2, 3, 4, '...', totalPages - 1, totalPages);
        } else if (currentPage >= totalPages - 2) {
          // Near the end
          items.push('...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
          // Somewhere in the middle
          items.push('...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        }
      }
      
      setPaginationItems(items);
    };
    
    generatePaginationItems();
  }, [currentPage, totalPages]);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious 
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
            className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>
        
        {paginationItems.map((item, index) => (
          <PaginationItem key={`${item}-${index}`}>
            {typeof item === 'number' ? (
              <PaginationLink 
                isActive={item === currentPage}
                onClick={() => onPageChange(item)}
              >
                {item}
              </PaginationLink>
            ) : (
              <span className="flex h-9 w-9 items-center justify-center opacity-50">...</span>
            )}
          </PaginationItem>
        ))}
        
        <PaginationItem>
          <PaginationNext 
            onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}