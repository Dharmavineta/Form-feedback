import React from "react";
import { Droppable } from "@hello-pangea/dnd";
import QuestionItem from "./QuestionItem";
import { QuestionType } from "@/db/schema";

interface QuestionListProps {
  questions: QuestionType[];
}

const QuestionList: React.FC<QuestionListProps> = React.memo(
  ({ questions }) => {
    return (
      <Droppable droppableId="questions" type="question">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-6 flex-1"
          >
            {questions.map((question, index) => (
              <QuestionItem
                key={question.id}
                question={question}
                index={index}
                isNewlyAdded={index === questions.length - 1}
                questionNumber={index + 1} // Add this line
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    );
  }
);

QuestionList.displayName = "QuestionList";

export default QuestionList;
