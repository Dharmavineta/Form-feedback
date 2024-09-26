"use client";
import React, { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

const initialItems = [
  { id: "item1", content: "Item 1" },
  { id: "item2", content: "Item 2" },
  { id: "item3", content: "Item 3" },
  { id: "item4", content: "Item 4" },
];

const FormBuilder: React.FC = () => {
  const [items, setItems] = useState(initialItems);

  const onDragEnd = (result: DropResult) => {
    console.log("Drag ended", result);
    if (!result.destination) {
      console.log("No destination");
      return;
    }

    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);

    console.log("Setting new items", newItems);
    setItems(newItems);
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Drag and Drop Example</h2>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="list">
          {(provided) => (
            <ul
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2 min-h-[200px] border-2 border-dashed border-gray-300 p-4"
            >
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided, snapshot) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`bg-white border-2 p-4 rounded shadow flex items-center justify-between ${
                        snapshot.isDragging ? "bg-gray-100 border-blue-500" : ""
                      }`}
                    >
                      <span>{item.content}</span>
                      <span
                        {...provided.dragHandleProps}
                        className="mr-2 cursor-move text-gray-400 hover:text-gray-600"
                      >
                        ≡
                      </span>
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default FormBuilder;
