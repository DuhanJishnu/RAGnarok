-- CreateTable
CREATE TABLE "public"."FileContainer" (
    "id" SERIAL NOT NULL,
    "Layer1_Hash" TEXT NOT NULL,
    "Layer2_Hash" TEXT NOT NULL,
    "Layer3_Hash" TEXT NOT NULL,
    "Layer4_Hash" TEXT NOT NULL,
    "Layer5_Hash" TEXT NOT NULL,
    "FileCount" INTEGER NOT NULL DEFAULT 0,
    "isFullyPopulated" BOOLEAN NOT NULL DEFAULT false,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FileContainer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FileContainer_Layer1_Hash_key" ON "public"."FileContainer"("Layer1_Hash");

-- CreateIndex
CREATE UNIQUE INDEX "FileContainer_Layer2_Hash_key" ON "public"."FileContainer"("Layer2_Hash");

-- CreateIndex
CREATE UNIQUE INDEX "FileContainer_Layer3_Hash_key" ON "public"."FileContainer"("Layer3_Hash");

-- CreateIndex
CREATE UNIQUE INDEX "FileContainer_Layer4_Hash_key" ON "public"."FileContainer"("Layer4_Hash");

-- CreateIndex
CREATE UNIQUE INDEX "FileContainer_Layer5_Hash_key" ON "public"."FileContainer"("Layer5_Hash");
