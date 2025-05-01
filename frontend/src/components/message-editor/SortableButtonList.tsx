import React from "react";
import { SortableButton } from "./SortableButton";
import { ButtonData } from "@/lib/types";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';

interface SortableButtonListProps {
  buttons: ButtonData[];
  groupId: string;
  onChange: (groupId: string, updatedData: Partial<{ buttons: ButtonData[] }>) => void;
  isButtonNameDuplicate?: (groupId: string, buttonId: string, name: string) => boolean;
}

export function SortableButtonList({ 
  buttons, 
  groupId, 
  onChange, 
  isButtonNameDuplicate
}: SortableButtonListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = buttons.findIndex(btn => btn.id === active.id);
      const newIndex = buttons.findIndex(btn => btn.id === over.id);
      
      const newButtons = arrayMove(buttons, oldIndex, newIndex).map((btn, idx) => ({
        ...btn,
        index: idx
      }));
      
      onChange(groupId, { buttons: newButtons });
    }
  };
  
  const handleButtonChange = (buttonId, updatedData) => {
    const updatedButtons = buttons.map(button =>
      button.id === buttonId ? { ...button, ...updatedData } : button
    );
    onChange(groupId, { buttons: updatedButtons });
  };
  
  const handleButtonRemove = (buttonId) => {
    const updatedButtons = buttons.filter(button => button.id !== buttonId);
    onChange(groupId, { buttons: updatedButtons });
  };
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
    >
      <SortableContext
        items={buttons.map(btn => btn.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {buttons.map((button) => (
            <SortableButton
              key={button.id}
              button={button}
              onChange={handleButtonChange}
              onRemove={handleButtonRemove}
              isButtonNameDuplicate={isButtonNameDuplicate}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
