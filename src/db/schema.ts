import {
  pgTable,
  varchar,
  uuid,
  integer,
  boolean,
  timestamp,
  text,
  date,
  json,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pgEnum } from "drizzle-orm/pg-core";

// Question type enum
export const questionTypeEnum = pgEnum("question_type", [
  "text",
  "radio",
  "checkbox",
  "select",
  "date",
  "time",
]);

// Define a type for the option structure
export type QuestionOption = {
  id: string;
  text: string;
  order: number;
};

// Users table (for form creators)
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  forms: many(forms),
}));

// Forms table
export const forms = pgTable("forms", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .references(() => users.clerkId)
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  publishedAt: timestamp("published_at"),
  font: varchar("font", { length: 100 }).default("Arial"),
  backgroundColor: text("background_color").default("#FFFFFF"),
});

export const formsRelations = relations(forms, ({ one, many }) => ({
  user: one(users, {
    fields: [forms.userId],
    references: [users.id],
  }),
  questions: many(questions),
  sessions: many(sessions),
  responses: many(responses),
  formViews: many(formViews),
  dailyStats: many(dailyStats),
}));

// Questions table
export const questions = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  formId: uuid("form_id")
    .references(() => forms.id, { onDelete: "cascade" })
    .notNull(),
  questionText: text("question_text").notNull(),
  questionType: questionTypeEnum("question_type").notNull(),
  order: integer("order").notNull(),
  required: boolean("required").default(false),
  options: json("options").$type<QuestionOption[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const questionsRelations = relations(questions, ({ one, many }) => ({
  form: one(forms, {
    fields: [questions.formId],
    references: [forms.id],
  }),
  answers: many(answers),
  interactions: many(questionInteraction),
}));

// Sessions table
export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
  formId: uuid("form_id")
    .references(() => forms.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  totalTimeSpent: integer("total_time_spent").default(0),
});

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  form: one(forms, {
    fields: [sessions.formId],
    references: [forms.id],
  }),
  responses: many(responses),
  formViews: many(formViews),
  questionInteractions: many(questionInteraction),
}));

// Responses table
export const responses = pgTable("responses", {
  id: uuid("id").defaultRandom().primaryKey(),
  formId: uuid("form_id")
    .references(() => forms.id)
    .notNull(),
  sessionId: uuid("session_id")
    .references(() => sessions.id)
    .notNull(),
  isComplete: boolean("is_complete").default(false),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  totalTimeSpent: integer("total_time_spent").default(0),
});

export const responsesRelations = relations(responses, ({ one, many }) => ({
  form: one(forms, {
    fields: [responses.formId],
    references: [forms.id],
  }),
  session: one(sessions, {
    fields: [responses.sessionId],
    references: [sessions.id],
  }),
  answers: many(answers),
}));

// Answer table
export const answers = pgTable("answers", {
  id: uuid("id").defaultRandom().primaryKey(),
  responseId: uuid("response_id")
    .references(() => responses.id)
    .notNull(),
  questionId: uuid("question_id")
    .references(() => questions.id)
    .notNull(),
  answerText: text("answer_text"),
  answerOptionId: varchar("answer_option_id", { length: 255 }),
});

export const answersRelations = relations(answers, ({ one }) => ({
  response: one(responses, {
    fields: [answers.responseId],
    references: [responses.id],
  }),
  question: one(questions, {
    fields: [answers.questionId],
    references: [questions.id],
  }),
}));

// Form Views table
export const formViews = pgTable("form_views", {
  id: uuid("id").defaultRandom().primaryKey(),
  formId: uuid("form_id")
    .references(() => forms.id)
    .notNull(),
  sessionId: uuid("session_id")
    .references(() => sessions.id)
    .notNull(),
  viewedAt: timestamp("viewed_at").defaultNow(),
  timeSpent: integer("time_spent").default(0),
});

export const formViewsRelations = relations(formViews, ({ one }) => ({
  form: one(forms, {
    fields: [formViews.formId],
    references: [forms.id],
  }),
  session: one(sessions, {
    fields: [formViews.sessionId],
    references: [sessions.id],
  }),
}));

// Daily Stats table
export const dailyStats = pgTable("daily_stats", {
  id: uuid("id").defaultRandom().primaryKey(),
  formId: uuid("form_id")
    .references(() => forms.id)
    .notNull(),
  date: date("date").notNull(),
  uniqueVisitors: integer("unique_visitors").default(0),
  totalViews: integer("total_views").default(0),
  totalResponses: integer("total_responses").default(0),
  completedResponses: integer("completed_responses").default(0),
  avgTimeSpent: integer("avg_time_spent").default(0),
});

export const dailyStatsRelations = relations(dailyStats, ({ one }) => ({
  form: one(forms, {
    fields: [dailyStats.formId],
    references: [forms.id],
  }),
}));

// Question Interaction table
export const questionInteraction = pgTable("question_interaction", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .references(() => sessions.id)
    .notNull(),
  questionId: uuid("question_id")
    .references(() => questions.id)
    .notNull(),
  timeSpent: integer("time_spent").default(0),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const questionInteractionRelations = relations(
  questionInteraction,
  ({ one }) => ({
    session: one(sessions, {
      fields: [questionInteraction.sessionId],
      references: [sessions.id],
    }),
    question: one(questions, {
      fields: [questionInteraction.questionId],
      references: [questions.id],
    }),
  })
);

// Export types
export type UserType = typeof users.$inferSelect;
export type NewUserType = typeof users.$inferInsert;

export type FormType = typeof forms.$inferSelect;
export type NewFormType = typeof forms.$inferInsert;

export type QuestionType = typeof questions.$inferSelect;
export type NewQuestionType = typeof questions.$inferInsert;

export type SessionType = typeof sessions.$inferSelect;
export type NewSessionType = typeof sessions.$inferInsert;

export type ResponseType = typeof responses.$inferSelect;
export type NewResponseType = typeof responses.$inferInsert;

export type AnswerType = typeof answers.$inferSelect;
export type NewAnswerType = typeof answers.$inferInsert;

export type FormViewType = typeof formViews.$inferSelect;
export type NewFormViewType = typeof formViews.$inferInsert;

export type DailyStatType = typeof dailyStats.$inferSelect;
export type NewDailyStatType = typeof dailyStats.$inferInsert;

export type QuestionInteractionType = typeof questionInteraction.$inferSelect;
export type NewQuestionInteractionType =
  typeof questionInteraction.$inferInsert;
