-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "columnId" TEXT,
ADD COLUMN     "labels" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "BoardColumn" (
    "id" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "position" INTEGER NOT NULL,
    "wipLimit" INTEGER,

    CONSTRAINT "BoardColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskChecklistItem" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,

    CONSTRAINT "TaskChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BoardColumn_position_key" ON "BoardColumn"("position");

-- CreateIndex
CREATE INDEX "TaskChecklistItem_taskId_idx" ON "TaskChecklistItem"("taskId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "BoardColumn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskChecklistItem" ADD CONSTRAINT "TaskChecklistItem_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed the 4 default columns matching the board that was previously
-- hardcoded in kanban-board.tsx, so existing boards render identically
-- until someone customizes them.
INSERT INTO "BoardColumn" ("id", "status", "name", "color", "position", "wipLimit") VALUES
  ('col_todo',        'TODO',        'To Do',       NULL, 0, NULL),
  ('col_in_progress', 'IN_PROGRESS', 'In Progress', NULL, 1, NULL),
  ('col_review',      'REVIEW',      'Review',      NULL, 2, NULL),
  ('col_completed',   'COMPLETED',   'Completed',   NULL, 3, NULL);

-- Backfill existing tasks into the column matching their current status.
UPDATE "Task" SET "columnId" = 'col_todo'        WHERE "status" = 'TODO';
UPDATE "Task" SET "columnId" = 'col_in_progress' WHERE "status" = 'IN_PROGRESS';
UPDATE "Task" SET "columnId" = 'col_review'      WHERE "status" = 'REVIEW';
UPDATE "Task" SET "columnId" = 'col_completed'   WHERE "status" = 'COMPLETED';
