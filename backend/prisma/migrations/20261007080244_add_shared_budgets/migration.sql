-- CreateTable
CREATE TABLE "SharedBudget" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedBudgetMember" (
    "id" TEXT NOT NULL,
    "sharedBudgetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedBudgetMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedExpense" (
    "id" TEXT NOT NULL,
    "sharedBudgetId" TEXT NOT NULL,
    "paidById" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedSettlement" (
    "id" TEXT NOT NULL,
    "sharedBudgetId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SharedBudget_ownerId_idx" ON "SharedBudget"("ownerId");

-- CreateIndex
CREATE INDEX "SharedBudgetMember_userId_idx" ON "SharedBudgetMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SharedBudgetMember_sharedBudgetId_userId_key" ON "SharedBudgetMember"("sharedBudgetId", "userId");

-- CreateIndex
CREATE INDEX "SharedExpense_sharedBudgetId_date_idx" ON "SharedExpense"("sharedBudgetId", "date");

-- CreateIndex
CREATE INDEX "SharedSettlement_sharedBudgetId_idx" ON "SharedSettlement"("sharedBudgetId");

-- AddForeignKey
ALTER TABLE "SharedBudget" ADD CONSTRAINT "SharedBudget_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedBudgetMember" ADD CONSTRAINT "SharedBudgetMember_sharedBudgetId_fkey" FOREIGN KEY ("sharedBudgetId") REFERENCES "SharedBudget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedBudgetMember" ADD CONSTRAINT "SharedBudgetMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedExpense" ADD CONSTRAINT "SharedExpense_sharedBudgetId_fkey" FOREIGN KEY ("sharedBudgetId") REFERENCES "SharedBudget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedExpense" ADD CONSTRAINT "SharedExpense_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedSettlement" ADD CONSTRAINT "SharedSettlement_sharedBudgetId_fkey" FOREIGN KEY ("sharedBudgetId") REFERENCES "SharedBudget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedSettlement" ADD CONSTRAINT "SharedSettlement_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedSettlement" ADD CONSTRAINT "SharedSettlement_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
