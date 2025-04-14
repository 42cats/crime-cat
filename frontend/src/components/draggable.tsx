
import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { DraggableItem } from '@/lib/types';

interface DraggableProps {
  item: DraggableItem;
  onDragStart: (item: DraggableItem) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, item: DraggableItem) => void;
  children: React.ReactNode;
  className?: string;
}

export function Draggable({
  item,
  onDragStart,
  onDragEnd,
  onDragOver,
  children,
  className
}: DraggableProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragTimeout = useRef<number | null>(null);

  const handleDragStart = (e: React.DragEvent) => {
    if (!dragRef.current) return;
    
    // Prevent event bubbling to parent draggable elements
    e.stopPropagation();
    
    // Create a ghost drag image that matches the actual element
    if (dragRef.current) {
      const rect = dragRef.current.getBoundingClientRect();
      const ghostElement = dragRef.current.cloneNode(true) as HTMLElement;
      
      // Style the ghost element
      ghostElement.style.position = 'absolute';
      ghostElement.style.top = '-1000px';
      ghostElement.style.opacity = '0.8';
      ghostElement.style.pointerEvents = 'none';
      ghostElement.style.width = `${rect.width}px`;
      ghostElement.style.transform = 'translateX(-10000px)';
      
      // Add the ghost element to the document
      document.body.appendChild(ghostElement);
      
      // Set the drag image with offset
      e.dataTransfer.setDragImage(ghostElement, 20, 20);
      
      // Clean up the ghost element after a short delay
      setTimeout(() => {
        ghostElement.remove();
      }, 100);
    }
    
    // Set data for dragging
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'move';
    
    // Add a small delay before setting isDragging to true for better visual feedback
    if (dragTimeout.current) window.clearTimeout(dragTimeout.current);
    dragTimeout.current = window.setTimeout(() => {
      setIsDragging(true);
      onDragStart(item);
    }, 50) as unknown as number;
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Stop propagation to prevent multiple drag end events
    e.stopPropagation();
    
    setIsDragging(false);
    if (dragTimeout.current) window.clearTimeout(dragTimeout.current);
    onDragEnd();
    
    // Cleanup any drag images
    document.querySelectorAll('body > div[style*="position: absolute"]').forEach(el => {
      if (el.innerHTML === '' && el.getBoundingClientRect().height === 0) {
        el.remove();
      }
    });
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    onDragOver(e, item);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // Specific component styles
  const dragStyles = {
    base: "transition-all duration-200 ease-spring",
    dragging: "opacity-50 scale-[0.98]"
  };

  return (
    <div
      ref={dragRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        dragStyles.base,
        isDragging && dragStyles.dragging,
        className
      )}
    >
      {children}
    </div>
  );
}
