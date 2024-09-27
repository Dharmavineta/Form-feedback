import {
  pgTable,
  varchar,
  uuid,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const forms = pgTable("forms", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: varchar("description", { length: 1000 }),
  creatorId: uuid("creator_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const questions = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  formId: uuid("form_id")
    .references(() => forms.id)
    .notNull(),
  questionText: varchar("question_text", { length: 1000 }).notNull(),
  questionType: varchar("question_type", { length: 50 }).notNull(),
  order: integer("order").notNull(),
  required: boolean("required").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const questionOptions = pgTable("question_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionId: uuid("question_id")
    .references(() => questions.id)
    .notNull(),
  optionText: varchar("option_text", { length: 255 }).notNull(),
  order: integer("order").notNull(),
});
